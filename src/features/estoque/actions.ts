"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categorias,
  estoqueMovimentacoes,
  produtos,
  produtosVariacoes,
  profiles,
  type Combinacao,
  type EstoqueMovimentacao,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getLojaInfo } from "@/lib/loja";
import { offsetDaPagina, PAGE_SIZE, parsePagina, totalPaginas } from "@/lib/pagination";
import { liberarReservasVencidas } from "@/features/pedidos/reserva";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

/** Limite abaixo do qual o estoque físico dispara o alerta (config da loja). */
export async function getLimiteEstoque(): Promise<number> {
  const info = await getLojaInfo();
  return info?.estoqueMinimo ?? 5;
}

export interface LinhaEstoque {
  variacaoId: string;
  produtoNome: string;
  combinacao: Combinacao;
  sku: string;
  estoque: number;
  reservado: number;
  disponivel: number;
  precoCusto: string;
}

export interface ListagemEstoque {
  itens: LinhaEstoque[];
  page: number;
  pageCount: number;
  limite: number;
}

/** Listagem paginada no banco das variações ativas, com filtro de estoque baixo. */
export async function listarEstoque(params: {
  q?: string;
  baixo?: string;
  categoria?: string;
  page?: string;
}): Promise<ListagemEstoque> {
  await requireAdmin();
  await liberarReservasVencidas();

  const page = parsePagina(params.page);
  const limite = await getLimiteEstoque();
  const q = params.q?.trim();

  const conds = [eq(produtosVariacoes.ativo, true)];
  if (q) {
    const like = or(ilike(produtos.nome, `%${q}%`), ilike(produtosVariacoes.sku, `%${q}%`));
    if (like) conds.push(like);
  }
  if (params.categoria) conds.push(eq(categorias.slug, params.categoria));
  if (params.baixo === "1") {
    conds.push(sql`${produtosVariacoes.estoque} <= ${limite}`);
  }
  const where = and(...conds);

  const [[{ total }], linhas] = await Promise.all([
    db
      .select({ total: count() })
      .from(produtosVariacoes)
      .innerJoin(produtos, eq(produtos.id, produtosVariacoes.produtoId))
      .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
      .where(where),
    db
      .select({
        variacaoId: produtosVariacoes.id,
        produtoNome: produtos.nome,
        combinacao: produtosVariacoes.combinacao,
        sku: produtosVariacoes.sku,
        estoque: produtosVariacoes.estoque,
        reservado: produtosVariacoes.reservado,
        disponivel: sql<number>`(${produtosVariacoes.estoque} - ${produtosVariacoes.reservado})`,
        precoCusto: produtosVariacoes.precoCusto,
      })
      .from(produtosVariacoes)
      .innerJoin(produtos, eq(produtos.id, produtosVariacoes.produtoId))
      .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
      .where(where)
      .orderBy(asc(produtosVariacoes.estoque), asc(produtos.nome))
      .limit(PAGE_SIZE)
      .offset(offsetDaPagina(page)),
  ]);

  return { itens: linhas, page, pageCount: totalPaginas(total), limite };
}

const MOTIVO_MAX = 200;

/** Entrada de estoque (recebimento): soma ao estoque físico e registra. */
export async function registrarEntrada(
  variacaoId: string,
  quantidade: number,
  motivo: string,
  nf: string,
): Promise<ResultadoAcao> {
  const admin = await requireAdmin();
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { ok: false, erro: "Quantidade deve ser um número maior que zero." };
  }

  await db.transaction(async (tx) => {
    const [v] = await tx
      .update(produtosVariacoes)
      .set({ estoque: sql`${produtosVariacoes.estoque} + ${quantidade}` })
      .where(eq(produtosVariacoes.id, variacaoId))
      .returning({ estoque: produtosVariacoes.estoque, precoCusto: produtosVariacoes.precoCusto });
    if (!v) return;

    await tx.insert(estoqueMovimentacoes).values({
      variacaoId,
      tipo: "entrada",
      quantidade,
      estoqueResultante: v.estoque,
      custoUnitario: v.precoCusto,
      nf: nf.trim().slice(0, 100) || null,
      motivo: motivo.trim().slice(0, MOTIVO_MAX) || null,
      usuarioId: admin.id,
    });
  });

  revalidatePath("/admin/estoque");
  return { ok: true };
}

/** Ajuste (correção): define o estoque físico. Bloqueia disponível negativo. */
export async function ajustarEstoque(
  variacaoId: string,
  novoEstoque: number,
  motivo: string,
): Promise<ResultadoAcao> {
  const admin = await requireAdmin();
  if (!Number.isInteger(novoEstoque) || novoEstoque < 0) {
    return { ok: false, erro: "Estoque deve ser um número igual ou maior que zero." };
  }

  const [atual] = await db
    .select({
      estoque: produtosVariacoes.estoque,
      reservado: produtosVariacoes.reservado,
      precoCusto: produtosVariacoes.precoCusto,
    })
    .from(produtosVariacoes)
    .where(eq(produtosVariacoes.id, variacaoId));
  if (!atual) return { ok: false, erro: "Variação não encontrada." };

  if (novoEstoque < atual.reservado) {
    return {
      ok: false,
      erro: `Há ${atual.reservado} reservado(s) em pedidos abertos. O estoque não pode ficar abaixo disso.`,
    };
  }
  if (novoEstoque === atual.estoque) return { ok: true };

  const delta = novoEstoque - atual.estoque;

  await db.transaction(async (tx) => {
    await tx
      .update(produtosVariacoes)
      .set({ estoque: novoEstoque })
      .where(eq(produtosVariacoes.id, variacaoId));

    await tx.insert(estoqueMovimentacoes).values({
      variacaoId,
      tipo: "ajuste",
      quantidade: delta,
      estoqueResultante: novoEstoque,
      custoUnitario: atual.precoCusto,
      motivo: motivo.trim().slice(0, MOTIVO_MAX) || null,
      usuarioId: admin.id,
    });
  });

  revalidatePath("/admin/estoque");
  return { ok: true };
}

/**
 * Edita os metadados de uma movimentação (NF, custo unitário e motivo). A
 * quantidade não é editável porque já moveu o saldo - para corrigir, faça uma
 * nova entrada/ajuste.
 */
export async function editarMovimentacao(
  id: string,
  dados: { nf: string; custoUnitario: string; motivo: string },
): Promise<ResultadoAcao> {
  await requireAdmin();

  const custo = dados.custoUnitario.trim().replace(",", ".");
  const custoNum = custo === "" ? null : Number(custo);
  if (custoNum !== null && (!Number.isFinite(custoNum) || custoNum < 0)) {
    return { ok: false, erro: "Custo inválido." };
  }

  await db
    .update(estoqueMovimentacoes)
    .set({
      nf: dados.nf.trim().slice(0, 100) || null,
      custoUnitario: custoNum === null ? null : custoNum.toFixed(2),
      motivo: dados.motivo.trim().slice(0, MOTIVO_MAX) || null,
    })
    .where(eq(estoqueMovimentacoes.id, id));

  revalidatePath("/admin/estoque");
  return { ok: true };
}

export interface LinhaMovimentacao {
  id: string;
  tipo: EstoqueMovimentacao["tipo"];
  quantidade: number;
  estoqueResultante: number;
  custoUnitario: string | null;
  nf: string | null;
  motivo: string | null;
  criadoEm: Date;
  produtoNome: string;
  combinacao: Combinacao;
  sku: string;
  usuarioNome: string | null;
}

export interface ListagemMovimentacoes {
  itens: LinhaMovimentacao[];
  page: number;
  pageCount: number;
}

const TIPOS = ["entrada", "ajuste", "venda", "devolucao"] as const;

/** Histórico paginado de movimentações, filtrável por tipo. */
export async function listarMovimentacoes(params: {
  q?: string;
  tipo?: string;
  page?: string;
}): Promise<ListagemMovimentacoes> {
  await requireAdmin();
  const page = parsePagina(params.page);
  const q = params.q?.trim();

  const conds = [];
  if (params.tipo && (TIPOS as readonly string[]).includes(params.tipo)) {
    conds.push(eq(estoqueMovimentacoes.tipo, params.tipo as EstoqueMovimentacao["tipo"]));
  }
  if (q) {
    const like = or(ilike(produtos.nome, `%${q}%`), ilike(produtosVariacoes.sku, `%${q}%`));
    if (like) conds.push(like);
  }
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], linhas] = await Promise.all([
    db
      .select({ total: count() })
      .from(estoqueMovimentacoes)
      .innerJoin(produtosVariacoes, eq(produtosVariacoes.id, estoqueMovimentacoes.variacaoId))
      .innerJoin(produtos, eq(produtos.id, produtosVariacoes.produtoId))
      .where(where),
    db
      .select({
        id: estoqueMovimentacoes.id,
        tipo: estoqueMovimentacoes.tipo,
        quantidade: estoqueMovimentacoes.quantidade,
        estoqueResultante: estoqueMovimentacoes.estoqueResultante,
        custoUnitario: estoqueMovimentacoes.custoUnitario,
        nf: estoqueMovimentacoes.nf,
        motivo: estoqueMovimentacoes.motivo,
        criadoEm: estoqueMovimentacoes.criadoEm,
        produtoNome: produtos.nome,
        combinacao: produtosVariacoes.combinacao,
        sku: produtosVariacoes.sku,
        usuarioNome: profiles.nome,
      })
      .from(estoqueMovimentacoes)
      .innerJoin(produtosVariacoes, eq(produtosVariacoes.id, estoqueMovimentacoes.variacaoId))
      .innerJoin(produtos, eq(produtos.id, produtosVariacoes.produtoId))
      .leftJoin(profiles, eq(profiles.id, estoqueMovimentacoes.usuarioId))
      .where(where)
      .orderBy(desc(estoqueMovimentacoes.criadoEm))
      .limit(PAGE_SIZE)
      .offset(offsetDaPagina(page)),
  ]);

  return { itens: linhas, page, pageCount: totalPaginas(total) };
}
