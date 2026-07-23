import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { getPagamento, situacaoPagamento } from "@/lib/mercadopago";
import { emailPedidoCancelado, emailPedidoPago } from "./emails";

/** Estados em que o estoque já foi baixado - cancelar devolve ao estoque. */
const STATUS_PAGOS = ["pago", "separando", "pronto_para_retirada"] as const;

/**
 * Cancela o pedido devolvendo estoque/reserva, de forma idempotente e atômica.
 * Devolve `true` só quando a transição realmente aconteceu (para o chamador
 * disparar e-mail uma única vez). Cancelamento pelo admin e o webhook de estorno
 * competem pela mesma transição condicional: quem transiciona primeiro devolve o
 * estoque, o outro casa zero linhas e vira no-op. Não chama o gateway.
 */
export async function aplicarCancelamento(
  pedidoId: string,
  gatewayPagamentoId?: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const set = gatewayPagamentoId
      ? { status: "cancelado" as const, gatewayPagamentoId }
      : { status: "cancelado" as const };

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
      // Registra a devolução no histórico de estoque.
      await tx.execute(sql`
        insert into "estoque_movimentacoes" (variacao_id, tipo, quantidade, estoque_resultante, custo_unitario)
        select i.variacao_id, 'devolucao', i.quantidade, v.estoque, v.preco_custo
        from "pedido_itens" as i
        join "produtos_variacoes" as v on v.id = i.variacao_id
        where i.pedido_id = ${pedidoId}
      `);
      return true;
    }

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
      return true;
    }

    return false; // Já cancelado/expirado/retirado: no-op.
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
    const virouPago = await db.transaction(async (tx) => {
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
        // Registra a venda no histórico de estoque.
        await tx.execute(sql`
          insert into "estoque_movimentacoes" (variacao_id, tipo, quantidade, estoque_resultante, custo_unitario)
          select i.variacao_id, 'venda', -i.quantidade, v.estoque, v.preco_custo
          from "pedido_itens" as i
          join "produtos_variacoes" as v on v.id = i.variacao_id
          where i.pedido_id = ${pedidoId}
        `);
        return true;
      }

      // Não estava aguardando: ou já está pago (idempotente, no-op) ou expirou.
      const [atual] = await tx
        .select({ status: pedidos.status })
        .from(pedidos)
        .where(eq(pedidos.id, pedidoId));
      if (atual?.status === "expirado") {
        await tx
          .update(pedidos)
          .set({ status: "pago", gatewayPagamentoId, pendenciaEstoque: true })
          .where(eq(pedidos.id, pedidoId));
        return true;
      }
      return false;
    });

    if (virouPago) await emailPedidoPago(pedidoId);
    return;
  }

  if (situacao === "estornado") {
    const cancelou = await aplicarCancelamento(pedidoId, gatewayPagamentoId);
    if (cancelou) await emailPedidoCancelado(pedidoId);
  }
  // Pendente (Pix aguardando, cartão em processamento): pedido segue aguardando.
}
