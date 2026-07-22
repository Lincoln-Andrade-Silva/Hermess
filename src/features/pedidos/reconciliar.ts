import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { getPagamento, situacaoPagamento } from "@/lib/mercadopago";

/** Estados em que o estoque já foi baixado — cancelar devolve ao estoque. */
const STATUS_PAGOS = ["pago", "separando", "pronto_para_retirada"] as const;

/**
 * Cancela o pedido devolvendo estoque/reserva, de forma idempotente e atômica.
 * A transição de status é condicional, então cancelamento pelo admin e o webhook
 * de estorno não devolvem estoque duas vezes: quem transiciona primeiro devolve,
 * o outro casa zero linhas e vira no-op. Não chama o gateway — o estorno em si é
 * responsabilidade de quem invoca (admin) ou já aconteceu (webhook).
 */
export async function aplicarCancelamento(
  pedidoId: string,
  gatewayPagamentoId?: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const set = gatewayPagamentoId
      ? { status: "cancelado" as const, gatewayPagamentoId }
      : { status: "cancelado" as const };

    // Pago (estoque baixado) → devolve ao estoque.
    const cancelados = await tx
      .update(pedidos)
      .set(set)
      .where(and(eq(pedidos.id, pedidoId), inArray(pedidos.status, [...STATUS_PAGOS])))
      .returning({ id: pedidos.id });

    if (cancelados.length > 0) {
      await tx.execute(sql`
        update "produtos_variacoes" as v
        set estoque = v.estoque + i.quantidade
        from "pedido_itens" as i
        where i.variacao_id = v.id and i.pedido_id = ${pedidoId}
      `);
      return;
    }

    // Ainda aguardando pagamento → libera a reserva.
    const liberados = await tx
      .update(pedidos)
      .set(set)
      .where(and(eq(pedidos.id, pedidoId), eq(pedidos.status, "aguardando_pagamento")))
      .returning({ id: pedidos.id });

    if (liberados.length > 0) {
      await tx.execute(sql`
        update "produtos_variacoes" as v
        set reservado = greatest(0, v.reservado - i.quantidade)
        from "pedido_itens" as i
        where i.variacao_id = v.id and i.pedido_id = ${pedidoId}
      `);
    }
    // Já cancelado/expirado/retirado: no-op (idempotente).
  });
}

/**
 * Consulta o pagamento no MP e reflete no pedido. Usado no webhook (type=payment)
 * e no retorno do checkout. Idempotente: a conversão de reserva em baixa de
 * estoque só acontece na transição `aguardando_pagamento → pago`, protegida pelo
 * WHERE condicional (webhook duplicado não baixa estoque duas vezes).
 */
export async function reconciliarPagamentoPedido(paymentId: string): Promise<void> {
  const pag = await getPagamento(paymentId).catch(() => null);
  if (!pag) return;

  const [, pedidoId] = (pag.external_reference ?? "").split(":");
  if (!pedidoId) return;

  const situacao = situacaoPagamento(pag.status);
  const gatewayPagamentoId = String(pag.id);

  if (situacao === "aprovado") {
    await db.transaction(async (tx) => {
      const convertidos = await tx
        .update(pedidos)
        .set({ status: "pago", gatewayPagamentoId })
        .where(and(eq(pedidos.id, pedidoId), eq(pedidos.status, "aguardando_pagamento")))
        .returning({ id: pedidos.id });

      if (convertidos.length > 0) {
        // Reserva vira baixa: sai de estoque e de reservado (disponível não muda).
        await tx.execute(sql`
          update "produtos_variacoes" as v
          set estoque = greatest(0, v.estoque - i.quantidade),
              reservado = greatest(0, v.reservado - i.quantidade)
          from "pedido_itens" as i
          where i.variacao_id = v.id and i.pedido_id = ${pedidoId}
        `);
        return;
      }

      // Não estava aguardando: ou já está pago (idempotente, no-op) ou expirou.
      const [atual] = await tx
        .select({ status: pedidos.status })
        .from(pedidos)
        .where(eq(pedidos.id, pedidoId));
      if (atual?.status === "expirado") {
        // Reserva já foi devolvida; honra o pagamento mas sinaliza revisão manual.
        await tx
          .update(pedidos)
          .set({ status: "pago", gatewayPagamentoId, pendenciaEstoque: true })
          .where(eq(pedidos.id, pedidoId));
      }
    });
    return;
  }

  if (situacao === "estornado") {
    await aplicarCancelamento(pedidoId, gatewayPagamentoId);
  }
  // Pendente (Pix aguardando, cartão em processamento): pedido segue aguardando.
}
