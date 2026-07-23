"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  categorias,
  estoqueMovimentacoes,
  pedidoItens,
  pedidos,
  produtos,
  produtosVariacoes,
  type Combinacao,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { offsetDaPagina, totalPaginas } from "@/lib/pagination";
import { liberarReservasVencidas } from "@/features/pedidos/reserva";

const PDV_PAGE_SIZE = 12;

export interface VariacaoPdv {
  variacaoId: string;
  produtoNome: string;
  sku: string;
  combinacao: Combinacao;
  preco: string;
  disponivel: number;
  imagem: string | null;
}

export interface ListagemPdv {
  itens: VariacaoPdv[];
  page: number;
  pageCount: number;
}

/**
 * Variações ativas com saldo, paginadas. Sem busca já lista tudo (por nome do
 * produto); filtros de texto (nome/SKU) e categoria são opcionais.
 */
export async function listarVariacoesPdv(params: {
  q?: string;
  categoria?: string;
  page?: number;
}): Promise<ListagemPdv> {
  await requireAdmin();
  await liberarReservasVencidas();

  const page = Math.max(1, params.page ?? 1);
  const q = params.q?.trim();

  const conds = [
    eq(produtosVariacoes.ativo, true),
    eq(produtos.ativo, true),
    sql`(${produtosVariacoes.estoque} - ${produtosVariacoes.reservado}) > 0`,
  ];
  if (q) {
    const like = or(ilike(produtos.nome, `%${q}%`), ilike(produtosVariacoes.sku, `%${q}%`));
    if (like) conds.push(like);
  }
  if (params.categoria) conds.push(eq(categorias.slug, params.categoria));
  const where = and(...conds);

  const [[{ total }], itens] = await Promise.all([
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
        sku: produtosVariacoes.sku,
        combinacao: produtosVariacoes.combinacao,
        preco: produtosVariacoes.preco,
        disponivel: sql<number>`(${produtosVariacoes.estoque} - ${produtosVariacoes.reservado})`,
        imagem: sql<string | null>`coalesce(
          ${produtosVariacoes.imagemUrl},
          (select url from produtos_imagens where produto_id = ${produtosVariacoes.produtoId} order by ordem asc limit 1)
        )`,
      })
      .from(produtosVariacoes)
      .innerJoin(produtos, eq(produtos.id, produtosVariacoes.produtoId))
      .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
      .where(where)
      .orderBy(asc(produtos.nome), asc(produtosVariacoes.sku))
      .limit(PDV_PAGE_SIZE)
      .offset(offsetDaPagina(page, PDV_PAGE_SIZE)),
  ]);

  return { itens, page, pageCount: totalPaginas(total, PDV_PAGE_SIZE) };
}

const METODOS = ["dinheiro", "pix", "credito", "debito"] as const;

const vendaSchema = z.object({
  nome: z.string().trim().max(120).optional(),
  metodoPagamento: z.enum(METODOS),
  itens: z
    .array(
      z.object({
        variacaoId: z.string().uuid(),
        quantidade: z.number().int().positive().max(999),
      }),
    )
    .min(1, "Adicione ao menos um item."),
});

export type VendaPdvInput = z.input<typeof vendaSchema>;

export type ResultadoVenda = { ok: true; numero: number } | { ok: false; erro: string };

class IndisponivelError extends Error {}

/** Finaliza uma venda de balcão: baixa estoque na hora e registra como `retirado`. */
export async function finalizarVendaPdv(input: VendaPdvInput): Promise<ResultadoVenda> {
  await requireAdmin();

  const parsed = vendaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, metodoPagamento, itens } = parsed.data;

  const somados = new Map<string, number>();
  for (const item of itens) {
    somados.set(item.variacaoId, (somados.get(item.variacaoId) ?? 0) + item.quantidade);
  }
  const linhas = [...somados.entries()].map(([variacaoId, quantidade]) => ({ variacaoId, quantidade }));

  try {
    const numero = await db.transaction(async (tx) => {
      await liberarReservasVencidas(tx);

      const variacoes = await tx
        .select({
          id: produtosVariacoes.id,
          sku: produtosVariacoes.sku,
          preco: produtosVariacoes.preco,
          precoCusto: produtosVariacoes.precoCusto,
          combinacao: produtosVariacoes.combinacao,
          ativo: produtosVariacoes.ativo,
          nomeProduto: produtos.nome,
        })
        .from(produtosVariacoes)
        .innerJoin(produtos, eq(produtos.id, produtosVariacoes.produtoId))
        .where(
          inArray(
            produtosVariacoes.id,
            linhas.map((l) => l.variacaoId),
          ),
        );
      const mapa = new Map(variacoes.map((v) => [v.id, v]));

      let total = 0;
      const resultantes = new Map<string, number>();

      for (const linha of linhas) {
        const v = mapa.get(linha.variacaoId);
        if (!v || !v.ativo) throw new IndisponivelError("Um item não está mais disponível.");

        const baixado = await tx
          .update(produtosVariacoes)
          .set({ estoque: sql`${produtosVariacoes.estoque} - ${linha.quantidade}` })
          .where(
            and(
              eq(produtosVariacoes.id, linha.variacaoId),
              sql`(${produtosVariacoes.estoque} - ${produtosVariacoes.reservado}) >= ${linha.quantidade}`,
            ),
          )
          .returning({ estoque: produtosVariacoes.estoque });

        if (baixado.length === 0) {
          throw new IndisponivelError(`Estoque insuficiente para ${v.nomeProduto}.`);
        }
        resultantes.set(linha.variacaoId, baixado[0].estoque);
        total += Number(v.preco) * linha.quantidade;
      }

      const [pedido] = await tx
        .insert(pedidos)
        .values({
          nome: nome?.trim() || "Venda no balcão",
          telefone: "",
          canal: "pdv",
          metodoPagamento,
          status: "retirado",
          total: total.toFixed(2),
          expiraEm: new Date(),
        })
        .returning({ numero: pedidos.numero, id: pedidos.id });

      await tx.insert(pedidoItens).values(
        linhas.map((linha) => {
          const v = mapa.get(linha.variacaoId)!;
          return {
            pedidoId: pedido.id,
            variacaoId: linha.variacaoId,
            nomeProduto: v.nomeProduto,
            sku: v.sku,
            combinacao: v.combinacao as Combinacao,
            precoUnitario: v.preco,
            quantidade: linha.quantidade,
          };
        }),
      );

      await tx.insert(estoqueMovimentacoes).values(
        linhas.map((linha) => {
          const v = mapa.get(linha.variacaoId)!;
          return {
            variacaoId: linha.variacaoId,
            tipo: "venda" as const,
            quantidade: -linha.quantidade,
            estoqueResultante: resultantes.get(linha.variacaoId)!,
            custoUnitario: v.precoCusto,
            motivo: "Venda no balcão (PDV)",
          };
        }),
      );

      return pedido.numero;
    });

    revalidatePath("/admin/pedidos");
    revalidatePath("/admin/estoque");
    return { ok: true, numero };
  } catch (e) {
    if (e instanceof IndisponivelError) return { ok: false, erro: e.message };
    throw e;
  }
}
