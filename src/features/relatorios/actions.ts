"use server";

import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categorias,
  pedidoItens,
  pedidos,
  produtos,
  produtosVariacoes,
  type Pedido,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getLojaInfo } from "@/lib/loja";

const STATUS_VENDA: Pedido["status"][] = ["pago", "separando", "pronto_para_retirada", "retirado"];
const PERIODOS = [7, 30, 90] as const;

export function normalizarDias(diasParam?: string): number {
  return PERIODOS.includes(Number(diasParam) as (typeof PERIODOS)[number]) ? Number(diasParam) : 30;
}

function cutoffDe(dias: number): Date {
  return new Date(Date.now() - dias * 86_400_000);
}

export interface RelatorioFaturamento {
  total: number;
  vendas: number;
  ticket: number;
  porDia: { dia: string; vendas: number; total: number }[];
}

export async function relatorioFaturamento(dias: number): Promise<RelatorioFaturamento> {
  await requireAdmin();
  const where = and(inArray(pedidos.status, STATUS_VENDA), gte(pedidos.criadoEm, cutoffDe(dias)));

  const porDia = await db
    .select({
      dia: sql<string>`to_char(date_trunc('day', ${pedidos.criadoEm}), 'YYYY-MM-DD')`,
      vendas: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
    })
    .from(pedidos)
    .where(where)
    .groupBy(sql`date_trunc('day', ${pedidos.criadoEm})`)
    .orderBy(desc(sql`date_trunc('day', ${pedidos.criadoEm})`));

  const total = porDia.reduce((a, d) => a + d.total, 0);
  const vendas = porDia.reduce((a, d) => a + d.vendas, 0);
  return { total, vendas, ticket: vendas > 0 ? total / vendas : 0, porDia };
}

export interface LinhaProduto {
  nome: string;
  quantidade: number;
  faturamento: number;
  custo: number;
}

export async function relatorioProdutos(dias: number): Promise<LinhaProduto[]> {
  await requireAdmin();
  const where = and(inArray(pedidos.status, STATUS_VENDA), gte(pedidos.criadoEm, cutoffDe(dias)));

  return db
    .select({
      nome: pedidoItens.nomeProduto,
      quantidade: sql<number>`sum(${pedidoItens.quantidade})::int`,
      faturamento: sql<number>`sum(${pedidoItens.precoUnitario} * ${pedidoItens.quantidade})::float`,
      custo: sql<number>`coalesce(sum(coalesce(${produtosVariacoes.precoCusto}, 0) * ${pedidoItens.quantidade}), 0)::float`,
    })
    .from(pedidoItens)
    .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
    .leftJoin(produtosVariacoes, eq(produtosVariacoes.id, pedidoItens.variacaoId))
    .where(where)
    .groupBy(pedidoItens.nomeProduto)
    .orderBy(desc(sql`sum(${pedidoItens.precoUnitario} * ${pedidoItens.quantidade})`));
}

export interface LinhaPagamento {
  metodo: string;
  vendas: number;
  total: number;
}

export async function relatorioPagamentos(dias: number): Promise<LinhaPagamento[]> {
  await requireAdmin();
  const where = and(inArray(pedidos.status, STATUS_VENDA), gte(pedidos.criadoEm, cutoffDe(dias)));

  return db
    .select({
      metodo: sql<string>`case when ${pedidos.canal} = 'pdv' then coalesce(${pedidos.metodoPagamento}, 'balcao') else 'online' end`,
      vendas: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
    })
    .from(pedidos)
    .where(where)
    .groupBy(sql`case when ${pedidos.canal} = 'pdv' then coalesce(${pedidos.metodoPagamento}, 'balcao') else 'online' end`)
    .orderBy(desc(sql`coalesce(sum(${pedidos.total}), 0)`));
}

export interface RelatorioEstoque {
  valorEmEstoque: number;
  totalPecas: number;
  variacoesBaixo: number;
  esgotadas: number;
  porCategoria: { categoria: string; valor: number; pecas: number }[];
}

export async function relatorioEstoque(): Promise<RelatorioEstoque> {
  await requireAdmin();
  const info = await getLojaInfo();
  const limite = info?.estoqueMinimo ?? 5;

  const [totais] = await db
    .select({
      valor: sql<number>`coalesce(sum(${produtosVariacoes.estoque} * ${produtosVariacoes.precoCusto}), 0)::float`,
      pecas: sql<number>`coalesce(sum(${produtosVariacoes.estoque}), 0)::int`,
      baixo: sql<number>`count(*) filter (where ${produtosVariacoes.estoque} <= ${limite})::int`,
      esgotadas: sql<number>`count(*) filter (where ${produtosVariacoes.estoque} = 0)::int`,
    })
    .from(produtosVariacoes)
    .where(eq(produtosVariacoes.ativo, true));

  const porCategoria = await db
    .select({
      categoria: sql<string>`coalesce(${categorias.nome}, 'Sem categoria')`,
      valor: sql<number>`coalesce(sum(${produtosVariacoes.estoque} * ${produtosVariacoes.precoCusto}), 0)::float`,
      pecas: sql<number>`coalesce(sum(${produtosVariacoes.estoque}), 0)::int`,
    })
    .from(produtosVariacoes)
    .innerJoin(produtos, eq(produtos.id, produtosVariacoes.produtoId))
    .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(eq(produtosVariacoes.ativo, true))
    .groupBy(sql`coalesce(${categorias.nome}, 'Sem categoria')`)
    .orderBy(desc(sql`coalesce(sum(${produtosVariacoes.estoque} * ${produtosVariacoes.precoCusto}), 0)`));

  return {
    valorEmEstoque: totais?.valor ?? 0,
    totalPecas: totais?.pecas ?? 0,
    variacoesBaixo: totais?.baixo ?? 0,
    esgotadas: totais?.esgotadas ?? 0,
    porCategoria,
  };
}
