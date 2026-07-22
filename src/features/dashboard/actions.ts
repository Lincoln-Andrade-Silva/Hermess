"use server";

import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItens, pedidos, type Pedido } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/** Vendas efetivadas: pago e além (inclui o balcão, que nasce retirado). */
const STATUS_VENDA: Pedido["status"][] = ["pago", "separando", "pronto_para_retirada", "retirado"];

const PERIODOS = [7, 30, 90] as const;

export interface DashboardResumo {
  dias: number;
  faturamento: number;
  vendas: number;
  ticketMedio: number;
  itensVendidos: number;
  porDia: { dia: string; total: number }[];
  topProdutos: { nome: string; quantidade: number; total: number }[];
  porCanal: { online: number; pdv: number };
}

export async function resumoDashboard(diasParam?: string): Promise<DashboardResumo> {
  await requireAdmin();

  const dias = PERIODOS.includes(Number(diasParam) as (typeof PERIODOS)[number])
    ? Number(diasParam)
    : 30;
  const cutoff = new Date(Date.now() - dias * 86_400_000);
  const where = and(inArray(pedidos.status, STATUS_VENDA), gte(pedidos.criadoEm, cutoff));

  const [totais, itens, porDia, topProdutos, canais] = await Promise.all([
    db
      .select({
        vendas: sql<number>`count(*)::int`,
        faturamento: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(where),
    db
      .select({ qtd: sql<number>`coalesce(sum(${pedidoItens.quantidade}), 0)::int` })
      .from(pedidoItens)
      .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
      .where(where),
    db
      .select({
        dia: sql<string>`to_char(date_trunc('day', ${pedidos.criadoEm}), 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(where)
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
      .where(where)
      .groupBy(pedidoItens.nomeProduto)
      .orderBy(desc(sql`sum(${pedidoItens.quantidade})`))
      .limit(6),
    db
      .select({
        canal: pedidos.canal,
        total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(where)
      .groupBy(pedidos.canal),
  ]);

  const faturamento = totais[0]?.faturamento ?? 0;
  const vendas = totais[0]?.vendas ?? 0;

  return {
    dias,
    faturamento,
    vendas,
    ticketMedio: vendas > 0 ? faturamento / vendas : 0,
    itensVendidos: itens[0]?.qtd ?? 0,
    porDia,
    topProdutos,
    porCanal: {
      online: canais.find((c) => c.canal === "online")?.total ?? 0,
      pdv: canais.find((c) => c.canal === "pdv")?.total ?? 0,
    },
  };
}
