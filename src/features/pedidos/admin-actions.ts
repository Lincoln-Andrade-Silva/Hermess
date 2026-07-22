"use server";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItens, pedidos, statusPedido, type Pedido } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { estornarPagamento } from "@/lib/mercadopago";
import { offsetDaPagina, PAGE_SIZE, parsePagina, totalPaginas } from "@/lib/pagination";
import { selecionarItensComImagem, type ItemComImagem } from "./itens";
import { aplicarCancelamento } from "./reconciliar";
import { CANCELAVEIS, PROXIMO_STATUS } from "./status";

type StatusPedido = Pedido["status"];

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

export interface PedidoLinha {
  numero: number;
  status: StatusPedido;
  nome: string;
  telefone: string;
  total: string;
  quantidadeItens: number;
  pendenciaEstoque: boolean;
  criadoEm: Date;
}

export interface ListagemPedidos {
  itens: PedidoLinha[];
  page: number;
  pageCount: number;
  total: number;
}

/** Listagem paginada no banco (LIMIT/OFFSET + COUNT), filtros por status/período/busca. */
export async function listarPedidosAdmin(params: {
  q?: string;
  status?: string;
  page?: string;
}): Promise<ListagemPedidos> {
  await requireAdmin();

  const page = parsePagina(params.page);
  const q = params.q?.trim();
  const conds = [];

  if (params.status && (statusPedido.enumValues as readonly string[]).includes(params.status)) {
    conds.push(eq(pedidos.status, params.status as StatusPedido));
  }
  if (q) {
    const like = or(ilike(pedidos.nome, `%${q}%`), ilike(pedidos.telefone, `%${q}%`));
    const num = Number(q);
    conds.push(Number.isInteger(num) && num > 0 ? or(eq(pedidos.numero, num), like) : like);
  }
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], linhas] = await Promise.all([
    db.select({ total: count() }).from(pedidos).where(where),
    db
      .select({
        numero: pedidos.numero,
        status: pedidos.status,
        nome: pedidos.nome,
        telefone: pedidos.telefone,
        total: pedidos.total,
        pendenciaEstoque: pedidos.pendenciaEstoque,
        criadoEm: pedidos.criadoEm,
        quantidadeItens: sql<number>`cast(coalesce(sum(${pedidoItens.quantidade}), 0) as int)`,
      })
      .from(pedidos)
      .leftJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
      .where(where)
      .groupBy(pedidos.id)
      .orderBy(desc(pedidos.criadoEm))
      .limit(PAGE_SIZE)
      .offset(offsetDaPagina(page)),
  ]);

  return { itens: linhas, page, pageCount: totalPaginas(total), total };
}

export interface PedidoAdminDetalhe {
  numero: number;
  status: StatusPedido;
  nome: string;
  telefone: string;
  total: string;
  gatewayPagamentoId: string | null;
  pendenciaEstoque: boolean;
  expiraEm: Date;
  criadoEm: Date;
  itens: ItemComImagem[];
}

export async function buscarPedidoAdmin(numero: number): Promise<PedidoAdminDetalhe | null> {
  await requireAdmin();

  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.numero, numero));
  if (!pedido) return null;

  const itens = await selecionarItensComImagem(pedido.id);

  return {
    numero: pedido.numero,
    status: pedido.status,
    nome: pedido.nome,
    telefone: pedido.telefone,
    total: pedido.total,
    gatewayPagamentoId: pedido.gatewayPagamentoId,
    pendenciaEstoque: pedido.pendenciaEstoque,
    expiraEm: pedido.expiraEm,
    criadoEm: pedido.criadoEm,
    itens,
  };
}

/** Avança o pedido na cadeia de retirada (pago → separando → pronto → retirado). */
export async function avancarStatus(numero: number): Promise<ResultadoAcao> {
  await requireAdmin();

  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.numero, numero));
  if (!pedido) return { ok: false, erro: "Pedido não encontrado." };

  const proximo = PROXIMO_STATUS[pedido.status];
  if (!proximo) return { ok: false, erro: "Este pedido não tem próximo status." };

  await db
    .update(pedidos)
    .set({ status: proximo })
    .where(and(eq(pedidos.id, pedido.id), eq(pedidos.status, pedido.status)));

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${numero}`);
  return { ok: true };
}

/** Status com pagamento/estoque ativo — exigem cancelamento antes de excluir. */
const NAO_EXCLUIVEIS: StatusPedido[] = ["pago", "separando", "pronto_para_retirada"];

/**
 * Exclui o pedido em definitivo (cascade nos itens). Pedido `aguardando` tem a
 * reserva liberada antes. Pedido com pagamento ativo não é excluível — precisa
 * ser cancelado antes (para estornar), evitando apagar dinheiro sem estorno.
 */
export async function excluirPedido(numero: number): Promise<ResultadoAcao> {
  await requireAdmin();

  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.numero, numero));
  if (!pedido) return { ok: false, erro: "Pedido não encontrado." };
  if (NAO_EXCLUIVEIS.includes(pedido.status)) {
    return { ok: false, erro: "Cancele o pedido antes de excluir — há pagamento envolvido." };
  }

  await db.transaction(async (tx) => {
    if (pedido.status === "aguardando_pagamento") {
      await tx.execute(sql`
        update "produtos_variacoes" as v
        set reservado = greatest(0, v.reservado - i.quantidade)
        from "pedido_itens" as i
        where i.variacao_id = v.id and i.pedido_id = ${pedido.id}
      `);
    }
    await tx.delete(pedidos).where(eq(pedidos.id, pedido.id));
  });

  revalidatePath("/admin/pedidos");
  return { ok: true };
}

/** Cancela o pedido: estorna no MP quando pago e devolve o estoque/reserva. */
export async function cancelarPedido(numero: number): Promise<ResultadoAcao> {
  await requireAdmin();

  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.numero, numero));
  if (!pedido) return { ok: false, erro: "Pedido não encontrado." };
  if (!CANCELAVEIS.includes(pedido.status)) {
    return { ok: false, erro: "Este pedido não pode ser cancelado." };
  }

  // Estorna no gateway antes de mexer no domínio; se falhar, aborta sem cancelar.
  if (pedido.gatewayPagamentoId && pedido.status !== "aguardando_pagamento") {
    try {
      await estornarPagamento(pedido.gatewayPagamentoId);
    } catch {
      return { ok: false, erro: "Falha ao estornar no Mercado Pago. Tente novamente." };
    }
  }

  await aplicarCancelamento(pedido.id);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${numero}`);
  return { ok: true };
}
