"use server";

import { and, between, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItens, pedidos, type Pedido } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { normalizarDias } from "@/lib/periodo";

/** Vendas efetivadas: pago e além (inclui o balcão, que nasce retirado). */
const STATUS_VENDA: Pedido["status"][] = ["pago", "separando", "pronto_para_retirada", "retirado"];

export interface DashboardResumo {
  dias: number;
  faturamento: number;
  faturamentoAnterior: number;
  vendas: number;
  vendasAnterior: number;
  ticketMedio: number;
  itensVendidos: number;
  porDia: { dia: string; total: number }[];
  topProdutos: { nome: string; quantidade: number; total: number }[];
  porCanal: { online: number; pdv: number };
  porMetodo: { metodo: string; vendas: number; total: number }[];
  porStatus: { status: Pedido["status"]; quantidade: number }[];
}

const METODO_SQL = sql<string>`case when ${pedidos.canal} = 'pdv' then coalesce(${pedidos.metodoPagamento}, 'balcao') else 'online' end`;

export async function resumoDashboard(diasParam?: string): Promise<DashboardResumo> {
  await requireAdmin();

  const dias = normalizarDias(diasParam);
  const agora = Date.now();
  const cutoff = new Date(agora - dias * 86_400_000);
  const cutoffAnterior = new Date(agora - 2 * dias * 86_400_000);

  const vendaAtual = and(inArray(pedidos.status, STATUS_VENDA), gte(pedidos.criadoEm, cutoff));
  const vendaAnterior = and(
    inArray(pedidos.status, STATUS_VENDA),
    between(pedidos.criadoEm, cutoffAnterior, cutoff),
  );

  const [atual, anterior, itens, porDia, topProdutos, canais, metodos, status] = await Promise.all([
    db
      .select({
        vendas: sql<number>`count(*)::int`,
        faturamento: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(vendaAtual),
    db
      .select({
        vendas: sql<number>`count(*)::int`,
        faturamento: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(vendaAnterior),
    db
      .select({ qtd: sql<number>`coalesce(sum(${pedidoItens.quantidade}), 0)::int` })
      .from(pedidoItens)
      .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
      .where(vendaAtual),
    db
      .select({
        dia: sql<string>`to_char(date_trunc('day', ${pedidos.criadoEm}), 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(vendaAtual)
      .groupBy(sql`date_trunc('day', ${pedidos.criadoEm})`)
      .orderBy(sql`date_trunc('day', ${pedidos.criadoEm})`),
    db
      .select({
        nome: pedidoItens.nomeProduto,
        quantidade: sql<number>`sum(${pedidoItens.quantidade})::int`,
        total: sql<number>`sum(${pedidoItens.precoUnitario} * ${pedidoItens.quantidade})::float`,
      })
      .from(pedidoItens)
      .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
      .where(vendaAtual)
      .groupBy(pedidoItens.nomeProduto)
      .orderBy(desc(sql`sum(${pedidoItens.quantidade})`))
      .limit(6),
    db
      .select({ canal: pedidos.canal, total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float` })
      .from(pedidos)
      .where(vendaAtual)
      .groupBy(pedidos.canal),
    db
      .select({
        metodo: METODO_SQL,
        vendas: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(vendaAtual)
      .groupBy(METODO_SQL)
      .orderBy(desc(sql`coalesce(sum(${pedidos.total}), 0)`)),
    db
      .select({ status: pedidos.status, quantidade: sql<number>`count(*)::int` })
      .from(pedidos)
      .where(gte(pedidos.criadoEm, cutoff))
      .groupBy(pedidos.status),
  ]);

  const faturamento = atual[0]?.faturamento ?? 0;
  const vendas = atual[0]?.vendas ?? 0;

  return {
    dias,
    faturamento,
    faturamentoAnterior: anterior[0]?.faturamento ?? 0,
    vendas,
    vendasAnterior: anterior[0]?.vendas ?? 0,
    ticketMedio: vendas > 0 ? faturamento / vendas : 0,
    itensVendidos: itens[0]?.qtd ?? 0,
    porDia,
    topProdutos,
    porCanal: {
      online: canais.find((c) => c.canal === "online")?.total ?? 0,
      pdv: canais.find((c) => c.canal === "pdv")?.total ?? 0,
    },
    porMetodo: metodos,
    porStatus: status,
  };
}
