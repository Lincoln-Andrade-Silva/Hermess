import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { getPagamento, situacaoPagamento } from "@/lib/mercadopago";

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
    await db.transaction(async (tx) => {
      const [atual] = await tx.select().from(pedidos).where(eq(pedidos.id, pedidoId));
      if (!atual) return;

      if (atual.status === "pago") {
        // Devolve ao estoque o que havia sido baixado.
        await tx.execute(sql`
          update "produtos_variacoes" as v
          set estoque = v.estoque + i.quantidade
          from "pedido_itens" as i
          where i.variacao_id = v.id and i.pedido_id = ${pedidoId}
        `);
      } else if (atual.status === "aguardando_pagamento") {
        // Libera a reserva ainda pendente.
        await tx.execute(sql`
          update "produtos_variacoes" as v
          set reservado = greatest(0, v.reservado - i.quantidade)
          from "pedido_itens" as i
          where i.variacao_id = v.id and i.pedido_id = ${pedidoId}
        `);
      }

      await tx
        .update(pedidos)
        .set({ status: "cancelado", gatewayPagamentoId })
        .where(eq(pedidos.id, pedidoId));
    });
  }
  // Pendente (Pix aguardando, cartão em processamento): pedido segue aguardando.
}
