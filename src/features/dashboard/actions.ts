"use server";

import { and, between, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItens, pedidos, produtosVariacoes, type Pedido } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getLojaInfo } from "@/lib/loja";
import { resolverIntervalo, type ParamsPeriodo } from "@/lib/periodo";

const STATUS_VENDA: Pedido["status"][] = ["pago", "separando", "pronto_para_retirada", "retirado"];

const METODO_SQL = sql<string>`case when ${pedidos.canal} = 'pdv' then coalesce(${pedidos.metodoPagamento}, 'balcao') else 'online' end`;

export interface DashboardResumo {
  label: string;
  labelAnterior: string;
  faturamento: number;
  faturamentoAnterior: number;
  vendas: number;
  vendasAnterior: number;
  ticketMedio: number;
  ticketMedioAnterior: number;
  itensVendidos: number;
  custo: number;
  margem: number;
  aguardando: number;
  estoqueBaixo: number;
  porDia: { dia: string; total: number; vendas: number }[];
  porMetodo: { metodo: string; vendas: number; total: number }[];
  porCanal: { online: number; pdv: number };
  porStatus: { status: Pedido["status"]; quantidade: number }[];
  topProdutos: { nome: string; quantidade: number; total: number }[];
}

export async function resumoDashboard(params: ParamsPeriodo): Promise<DashboardResumo> {
  await requireAdmin();
  const iv = resolverIntervalo(params);
  const info = await getLojaInfo();
  const limite = info?.estoqueMinimo ?? 5;

  const vendaAtual = and(inArray(pedidos.status, STATUS_VENDA), between(pedidos.criadoEm, iv.inicio, iv.fim));
  const vendaAnterior = and(
    inArray(pedidos.status, STATUS_VENDA),
    between(pedidos.criadoEm, iv.anterior.inicio, iv.anterior.fim),
  );

  const [atual, anterior, itens, custoRows, porDia, topProdutos, canais, metodos, status, pend, baixo] =
    await Promise.all([
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
          custo: sql<number>`coalesce(sum(coalesce(${produtosVariacoes.precoCusto}, 0) * ${pedidoItens.quantidade}), 0)::float`,
        })
        .from(pedidoItens)
        .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
        .leftJoin(produtosVariacoes, eq(produtosVariacoes.id, pedidoItens.variacaoId))
        .where(vendaAtual),
      db
        .select({
          dia: sql<string>`to_char(date_trunc('day', ${pedidos.criadoEm}), 'YYYY-MM-DD')`,
          total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
          vendas: sql<number>`count(*)::int`,
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
        .limit(8),
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
        .where(between(pedidos.criadoEm, iv.inicio, iv.fim))
        .groupBy(pedidos.status),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(pedidos)
        .where(eq(pedidos.status, "aguardando_pagamento")),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(produtosVariacoes)
        .where(and(eq(produtosVariacoes.ativo, true), lte(produtosVariacoes.estoque, limite))),
    ]);

  const faturamento = atual[0]?.faturamento ?? 0;
  const vendas = atual[0]?.vendas ?? 0;
  const fatAnt = anterior[0]?.faturamento ?? 0;
  const vendasAnt = anterior[0]?.vendas ?? 0;
  const custo = custoRows[0]?.custo ?? 0;

  return {
    label: iv.label,
    labelAnterior: iv.labelAnterior,
    faturamento,
    faturamentoAnterior: fatAnt,
    vendas,
    vendasAnterior: vendasAnt,
    ticketMedio: vendas > 0 ? faturamento / vendas : 0,
    ticketMedioAnterior: vendasAnt > 0 ? fatAnt / vendasAnt : 0,
    itensVendidos: itens[0]?.qtd ?? 0,
    custo,
    margem: faturamento - custo,
    aguardando: pend[0]?.n ?? 0,
    estoqueBaixo: baixo[0]?.n ?? 0,
    porDia,
    porMetodo: metodos,
    porCanal: {
      online: canais.find((c) => c.canal === "online")?.total ?? 0,
      pdv: canais.find((c) => c.canal === "pdv")?.total ?? 0,
    },
    porStatus: status,
    topProdutos,
  };
}
