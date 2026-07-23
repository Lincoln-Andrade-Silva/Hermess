"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItens, pedidos } from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";
import { getBaseUrl, getPagamentoConfig } from "@/lib/pagamento";
import { criarPreferencia } from "@/lib/mercadopago";
import { liberarReservasVencidas } from "./reserva";

export type ResultadoPagamento =
  | { ok: true; initPoint: string }
  | { ok: false; erro: string };

/**
 * Cria a preferência do Checkout Pro para um pedido do cliente logado e devolve
 * o link do MP. Só para pedidos ainda `aguardando_pagamento` e não expirados.
 */
export async function criarPagamento(numero: number): Promise<ResultadoPagamento> {
  const profile = await getCurrentProfile();

  // Não deixa pagar um pedido que já venceu.
  await liberarReservasVencidas();

  const [pedido] = await db
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.numero, numero), eq(pedidos.clienteId, profile.id)));
  if (!pedido) return { ok: false, erro: "Pedido não encontrado." };
  if (pedido.status !== "aguardando_pagamento") {
    return { ok: false, erro: "Este pedido não está mais aguardando pagamento." };
  }

  const cfg = await getPagamentoConfig();
  if (!cfg?.accessToken || !cfg.ativo) {
    return { ok: false, erro: "Pagamento indisponível no momento. Fale com a loja." };
  }

  const itens = await db
    .select({
      nomeProduto: pedidoItens.nomeProduto,
      combinacao: pedidoItens.combinacao,
      precoUnitario: pedidoItens.precoUnitario,
      quantidade: pedidoItens.quantidade,
    })
    .from(pedidoItens)
    .where(eq(pedidoItens.pedidoId, pedido.id));

  try {
    const { initPoint } = await criarPreferencia({
      itens: itens.map((i) => {
        const combo = Object.values(i.combinacao).join(" · ");
        return {
          titulo: combo ? `${i.nomeProduto} - ${combo}` : i.nomeProduto,
          quantidade: i.quantidade,
          precoUnitario: Number(i.precoUnitario),
        };
      }),
      payerEmail: profile.email,
      externalReference: `${profile.id}:${pedido.id}`,
      baseUrl: await getBaseUrl(),
      retornoPath: `/pedido/${pedido.numero}`,
    });
    return { ok: true, initPoint };
  } catch {
    return { ok: false, erro: "Não foi possível iniciar o pagamento. Tente novamente." };
  }
}
