"use server";

import { and, between, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categorias,
  estoqueMovimentacoes,
  pedidoItens,
  pedidos,
  produtos,
  produtosVariacoes,
  type EstoqueMovimentacao,
  type Pedido,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getLojaInfo } from "@/lib/loja";

const STATUS_VENDA: Pedido["status"][] = ["pago", "separando", "pronto_para_retirada", "retirado"];

export interface RelatorioFaturamento {
  total: number;
  vendas: number;
  ticket: number;
  custo: number;
  margem: number;
  porDia: { dia: string; vendas: number; total: number }[];
}

export async function relatorioFaturamento(inicio: Date, fim: Date): Promise<RelatorioFaturamento> {
  await requireAdmin();
  const where = and(inArray(pedidos.status, STATUS_VENDA), between(pedidos.criadoEm, inicio, fim));

  const [porDia, custoRows] = await Promise.all([
    db
      .select({
        dia: sql<string>`to_char(date_trunc('day', ${pedidos.criadoEm}), 'YYYY-MM-DD')`,
        vendas: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
      })
      .from(pedidos)
      .where(where)
      .groupBy(sql`date_trunc('day', ${pedidos.criadoEm})`)
      .orderBy(desc(sql`date_trunc('day', ${pedidos.criadoEm})`)),
    db
      .select({
        custo: sql<number>`coalesce(sum(coalesce(${produtosVariacoes.precoCusto}, 0) * ${pedidoItens.quantidade}), 0)::float`,
      })
      .from(pedidoItens)
      .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
      .leftJoin(produtosVariacoes, eq(produtosVariacoes.id, pedidoItens.variacaoId))
      .where(where),
  ]);

  const total = porDia.reduce((a, d) => a + d.total, 0);
  const vendas = porDia.reduce((a, d) => a + d.vendas, 0);
  const custo = custoRows[0]?.custo ?? 0;
  return { total, vendas, ticket: vendas > 0 ? total / vendas : 0, custo, margem: total - custo, porDia };
}

export interface LinhaProduto {
  nome: string;
  quantidade: number;
  faturamento: number;
  custo: number;
}

export async function relatorioProdutos(inicio: Date, fim: Date): Promise<LinhaProduto[]> {
  await requireAdmin();
  const where = and(inArray(pedidos.status, STATUS_VENDA), between(pedidos.criadoEm, inicio, fim));

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

export async function relatorioPagamentos(inicio: Date, fim: Date): Promise<LinhaPagamento[]> {
  await requireAdmin();
  const where = and(inArray(pedidos.status, STATUS_VENDA), between(pedidos.criadoEm, inicio, fim));
  const metodo = sql<string>`case when ${pedidos.canal} = 'pdv' then coalesce(${pedidos.metodoPagamento}, 'balcao') else 'online' end`;

  return db
    .select({
      metodo,
      vendas: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${pedidos.total}), 0)::float`,
    })
    .from(pedidos)
    .where(where)
    .groupBy(metodo)
    .orderBy(desc(sql`coalesce(sum(${pedidos.total}), 0)`));
}

export interface RelatorioEstoque {
  valorEmEstoque: number;
  totalPecas: number;
  variacoesBaixo: number;
  esgotadas: number;
  porCategoria: { categoria: string; valor: number; pecas: number }[];
  movimentacoes: { tipo: EstoqueMovimentacao["tipo"]; quantidade: number; valor: number }[];
}

export async function relatorioEstoque(inicio: Date, fim: Date): Promise<RelatorioEstoque> {
  await requireAdmin();
  const info = await getLojaInfo();
  const limite = info?.estoqueMinimo ?? 5;

  const [totais, porCategoria, movimentacoes] = await Promise.all([
    db
      .select({
        valor: sql<number>`coalesce(sum(${produtosVariacoes.estoque} * ${produtosVariacoes.precoCusto}), 0)::float`,
        pecas: sql<number>`coalesce(sum(${produtosVariacoes.estoque}), 0)::int`,
        baixo: sql<number>`count(*) filter (where ${produtosVariacoes.estoque} <= ${limite})::int`,
        esgotadas: sql<number>`count(*) filter (where ${produtosVariacoes.estoque} = 0)::int`,
      })
      .from(produtosVariacoes)
      .where(eq(produtosVariacoes.ativo, true)),
    db
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
      .orderBy(desc(sql`coalesce(sum(${produtosVariacoes.estoque} * ${produtosVariacoes.precoCusto}), 0)`)),
    db
      .select({
        tipo: estoqueMovimentacoes.tipo,
        quantidade: sql<number>`coalesce(sum(abs(${estoqueMovimentacoes.quantidade})), 0)::int`,
        valor: sql<number>`coalesce(sum(coalesce(${estoqueMovimentacoes.custoUnitario}, 0) * abs(${estoqueMovimentacoes.quantidade})), 0)::float`,
      })
      .from(estoqueMovimentacoes)
      .where(between(estoqueMovimentacoes.criadoEm, inicio, fim))
      .groupBy(estoqueMovimentacoes.tipo),
  ]);

  return {
    valorEmEstoque: totais[0]?.valor ?? 0,
    totalPecas: totais[0]?.pecas ?? 0,
    variacoesBaixo: totais[0]?.baixo ?? 0,
    esgotadas: totais[0]?.esgotadas ?? 0,
    porCategoria,
    movimentacoes,
  };
}
