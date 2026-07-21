"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, ilike, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  categorias,
  produtos,
  produtosImagens,
  produtosOpcoes,
  produtosVariacoes,
  type Combinacao,
  type FichaTecnica,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { offsetDaPagina, PAGE_SIZE, totalPaginas } from "@/lib/pagination";
import { slugUnico } from "@/lib/slug";
import { removerImagem, uploadImagem } from "@/lib/storage";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

export interface ProdutoDaLista {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  categoriaNome: string | null;
  imagemUrl: string | null;
  variacoes: number;
  estoque: number;
  precoMin: string | null;
  precoMax: string | null;
}

export interface ListaProdutos {
  itens: ProdutoDaLista[];
  page: number;
  pageCount: number;
}

/**
 * Listagem paginada no servidor. Os agregados de variação (contagem, estoque e
 * faixa de preço) saem em subselects para manter uma linha por produto — sem
 * eles a mesma peça apareceria repetida por variação, que é o defeito das
 * vitrines que analisamos.
 */
export async function listarProdutos(params: {
  page?: string;
  q?: string;
  categoria?: string;
}): Promise<ListaProdutos> {
  await requireAdmin();

  const page = Math.max(1, Number(params.page) || 1);
  const busca = params.q?.trim();
  const categoriaId = params.categoria && params.categoria !== "todos" ? params.categoria : null;

  const filtros = and(
    busca ? ilike(produtos.nome, `%${busca}%`) : undefined,
    categoriaId ? eq(produtos.categoriaId, categoriaId) : undefined,
  );

  const [{ total }] = await db.select({ total: count() }).from(produtos).where(filtros);

  const itens = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      slug: produtos.slug,
      ativo: produtos.ativo,
      categoriaNome: categorias.nome,
      imagemUrl: sql<string | null>`(
        select url from ${produtosImagens}
        where ${produtosImagens.produtoId} = ${produtos.id}
        order by ${produtosImagens.ordem} limit 1
      )`,
      variacoes: sql<number>`(
        select count(*)::int from ${produtosVariacoes}
        where ${produtosVariacoes.produtoId} = ${produtos.id}
      )`,
      estoque: sql<number>`(
        select coalesce(sum(estoque), 0)::int from ${produtosVariacoes}
        where ${produtosVariacoes.produtoId} = ${produtos.id}
      )`,
      precoMin: sql<string | null>`(
        select min(preco)::text from ${produtosVariacoes}
        where ${produtosVariacoes.produtoId} = ${produtos.id}
      )`,
      precoMax: sql<string | null>`(
        select max(preco)::text from ${produtosVariacoes}
        where ${produtosVariacoes.produtoId} = ${produtos.id}
      )`,
    })
    .from(produtos)
    .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(filtros)
    .orderBy(desc(produtos.criadoEm))
    .limit(PAGE_SIZE)
    .offset(offsetDaPagina(page));

  return { itens, page, pageCount: totalPaginas(total) };
}

export interface ProdutoCompleto {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoriaId: string | null;
  fichaTecnica: FichaTecnica | null;
  ativo: boolean;
  imagens: { url: string; ordem: number }[];
  opcoes: {
    nome: string;
    tipo: "texto" | "cor";
    ordem: number;
    valores: { valor: string; hex?: string }[];
  }[];
  variacoes: {
    sku: string;
    preco: string;
    estoque: number;
    imagemUrl: string | null;
    combinacao: Combinacao;
    ativo: boolean;
  }[];
}

export async function buscarProduto(id: string): Promise<ProdutoCompleto | null> {
  await requireAdmin();

  const [produto] = await db.select().from(produtos).where(eq(produtos.id, id));
  if (!produto) return null;

  const [imagens, opcoes, variacoes] = await Promise.all([
    db
      .select({ url: produtosImagens.url, ordem: produtosImagens.ordem })
      .from(produtosImagens)
      .where(eq(produtosImagens.produtoId, id))
      .orderBy(asc(produtosImagens.ordem)),
    db
      .select()
      .from(produtosOpcoes)
      .where(eq(produtosOpcoes.produtoId, id))
      .orderBy(asc(produtosOpcoes.ordem)),
    db
      .select()
      .from(produtosVariacoes)
      .where(eq(produtosVariacoes.produtoId, id))
      .orderBy(asc(produtosVariacoes.sku)),
  ]);

  return {
    id: produto.id,
    nome: produto.nome,
    slug: produto.slug,
    descricao: produto.descricao,
    categoriaId: produto.categoriaId,
    fichaTecnica: produto.fichaTecnica,
    ativo: produto.ativo,
    imagens,
    opcoes: opcoes.map((o) => ({
      nome: o.nome,
      tipo: o.tipo,
      ordem: o.ordem,
      valores: o.valores,
    })),
    variacoes: variacoes.map((v) => ({
      sku: v.sku,
      preco: v.preco,
      estoque: v.estoque,
      imagemUrl: v.imagemUrl,
      combinacao: v.combinacao,
      ativo: v.ativo,
    })),
  };
}

const valorOpcaoSchema = z.object({
  valor: z.string().trim().min(1, "Valor da opção vazio."),
  hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.")
    .optional(),
});

const produtoSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto."),
  descricao: z.string().trim().nullable().default(null),
  categoriaId: z.string().uuid("Selecione uma categoria.").nullable(),
  ativo: z.boolean().default(true),
  fichaTecnica: z
    .object({
      titulo: z.string().trim().min(1, "Título da tabela vazio."),
      colunas: z.array(z.string().trim().min(1, "Coluna sem nome.")).min(1),
      linhas: z.array(z.array(z.string().trim())),
    })
    .nullable()
    .default(null),
  imagens: z.array(z.string().url()).max(12, "Máximo de 12 imagens."),
  opcoes: z
    .array(
      z.object({
        nome: z.string().trim().min(1, "Nome do eixo vazio."),
        tipo: z.enum(["texto", "cor"]),
        valores: z.array(valorOpcaoSchema).min(1, "Cada eixo precisa de ao menos um valor."),
      }),
    )
    .max(3, "Máximo de 3 eixos de variação."),
  variacoes: z
    .array(
      z.object({
        sku: z.string().trim().min(1, "SKU vazio."),
        preco: z.coerce.number().nonnegative("Preço inválido."),
        estoque: z.coerce.number().int().min(0, "Estoque inválido."),
        imagemUrl: z.string().url().nullable().default(null),
        combinacao: z.record(z.string(), z.string()),
        ativo: z.boolean().default(true),
      }),
    )
    .min(1, "O produto precisa de ao menos uma variação."),
});

export type ProdutoInput = z.input<typeof produtoSchema>;

export async function salvarProduto(
  id: string | null,
  input: ProdutoInput,
): Promise<ResultadoAcao & { id?: string }> {
  await requireAdmin();

  const parsed = produtoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  // Dois eixos com o mesmo nome tornariam a combinação ambígua; a unique do
  // banco pegaria, mas a mensagem seria incompreensível.
  const nomesEixos = dados.opcoes.map((o) => o.nome.toLowerCase());
  if (new Set(nomesEixos).size !== nomesEixos.length) {
    return { ok: false, erro: "Dois eixos de variação com o mesmo nome." };
  }

  const skus = dados.variacoes.map((v) => v.sku.toLowerCase());
  if (new Set(skus).size !== skus.length) {
    return { ok: false, erro: "SKU repetido entre as variações." };
  }

  const slugsUsados = await db
    .select({ slug: produtos.slug })
    .from(produtos)
    .where(id ? ne(produtos.id, id) : undefined);
  const slug = slugUnico(
    dados.nome,
    slugsUsados.map((s) => s.slug),
  );

  try {
    const produtoId = await db.transaction(async (tx) => {
      let alvo = id;

      if (alvo) {
        await tx
          .update(produtos)
          .set({
            nome: dados.nome,
            slug,
            descricao: dados.descricao,
            categoriaId: dados.categoriaId,
            fichaTecnica: dados.fichaTecnica,
            ativo: dados.ativo,
          })
          .where(eq(produtos.id, alvo));
      } else {
        const [criado] = await tx
          .insert(produtos)
          .values({
            nome: dados.nome,
            slug,
            descricao: dados.descricao,
            categoriaId: dados.categoriaId,
            fichaTecnica: dados.fichaTecnica,
            ativo: dados.ativo,
          })
          .returning({ id: produtos.id });
        alvo = criado.id;
      }

      // Filhos são reescritos por completo: o formulário envia o estado final,
      // e diferenciar item a item aqui traria mais risco que ganho.
      await tx.delete(produtosImagens).where(eq(produtosImagens.produtoId, alvo));
      await tx.delete(produtosOpcoes).where(eq(produtosOpcoes.produtoId, alvo));
      await tx.delete(produtosVariacoes).where(eq(produtosVariacoes.produtoId, alvo));

      if (dados.imagens.length > 0) {
        await tx
          .insert(produtosImagens)
          .values(dados.imagens.map((url, ordem) => ({ produtoId: alvo!, url, ordem })));
      }

      if (dados.opcoes.length > 0) {
        await tx.insert(produtosOpcoes).values(
          dados.opcoes.map((o, ordem) => ({
            produtoId: alvo!,
            nome: o.nome,
            tipo: o.tipo,
            ordem,
            valores: o.valores,
          })),
        );
      }

      await tx.insert(produtosVariacoes).values(
        dados.variacoes.map((v) => ({
          produtoId: alvo!,
          sku: v.sku,
          preco: v.preco.toFixed(2),
          estoque: v.estoque,
          imagemUrl: v.imagemUrl,
          combinacao: v.combinacao,
          ativo: v.ativo,
        })),
      );

      return alvo!;
    });

    revalidatePath("/admin/produtos");
    return { ok: true, id: produtoId };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "";
    if (mensagem.includes("produtos_variacoes_sku_unique")) {
      return { ok: false, erro: "SKU já usado em outro produto." };
    }
    console.error("Salvar produto:", e);
    return { ok: false, erro: "Não foi possível salvar o produto." };
  }
}

export async function excluirProduto(id: string): Promise<ResultadoAcao> {
  await requireAdmin();

  // As URLs precisam ser lidas antes do delete, senão o arquivo fica órfão no
  // bucket consumindo cota para sempre.
  const imagens = await db
    .select({ url: produtosImagens.url })
    .from(produtosImagens)
    .where(eq(produtosImagens.produtoId, id));

  await db.delete(produtos).where(eq(produtos.id, id));

  // Só depois de apagar as linhas dá para saber quais arquivos ficaram sem
  // dono: um clone compartilha as URLs do original, e remover o arquivo aqui
  // deixaria o outro produto sem imagem.
  if (imagens.length > 0) {
    const urls = imagens.map((i) => i.url);
    const aindaEmUso = await db
      .select({ url: produtosImagens.url })
      .from(produtosImagens)
      .where(inArray(produtosImagens.url, urls));
    const usadas = new Set(aindaEmUso.map((i) => i.url));

    await Promise.all(urls.filter((url) => !usadas.has(url)).map((url) => removerImagem(url)));
  }

  revalidatePath("/admin/produtos");
  return { ok: true };
}

/**
 * Duplica o produto com todas as imagens, tipos de variação e a grade.
 *
 * A cópia nasce inativa: quase sempre o motivo de clonar é criar uma variação
 * do modelo, e publicar na vitrine um duplicado exato do original seria pior
 * que não clonar. As imagens são reaproveitadas por URL — não há cópia no
 * bucket, então excluir a cópia não pode remover arquivo (ver excluirProduto).
 */
export async function clonarProduto(id: string): Promise<ResultadoAcao & { id?: string }> {
  await requireAdmin();

  const original = await buscarProduto(id);
  if (!original) return { ok: false, erro: "Produto não encontrado." };

  const nome = `${original.nome} (clone)`;
  const slugsUsados = await db.select({ slug: produtos.slug }).from(produtos);
  const slug = slugUnico(
    nome,
    slugsUsados.map((s) => s.slug),
  );

  try {
    const novoId = await db.transaction(async (tx) => {
      const [criado] = await tx
        .insert(produtos)
        .values({
          nome,
          slug,
          descricao: original.descricao,
          categoriaId: original.categoriaId,
          fichaTecnica: original.fichaTecnica,
          ativo: false,
        })
        .returning({ id: produtos.id });

      if (original.imagens.length > 0) {
        await tx.insert(produtosImagens).values(
          original.imagens.map((imagem) => ({
            produtoId: criado.id,
            url: imagem.url,
            ordem: imagem.ordem,
          })),
        );
      }

      if (original.opcoes.length > 0) {
        await tx.insert(produtosOpcoes).values(
          original.opcoes.map((opcao) => ({
            produtoId: criado.id,
            nome: opcao.nome,
            tipo: opcao.tipo,
            ordem: opcao.ordem,
            valores: opcao.valores,
          })),
        );
      }

      if (original.variacoes.length > 0) {
        await tx.insert(produtosVariacoes).values(
          original.variacoes.map((variacao) => ({
            produtoId: criado.id,
            sku: variacao.sku,
            preco: variacao.preco,
            // Estoque não se duplica: a cópia é outro produto e começa zerada.
            estoque: 0,
            imagemUrl: variacao.imagemUrl,
            combinacao: variacao.combinacao,
            ativo: variacao.ativo,
          })),
        );
      }

      return criado.id;
    });

    revalidatePath("/admin/produtos");
    return { ok: true, id: novoId };
  } catch (e) {
    console.error("Clonar produto:", e);
    return { ok: false, erro: "Não foi possível clonar o produto." };
  }
}

export async function alternarAtivo(id: string, ativo: boolean): Promise<ResultadoAcao> {
  await requireAdmin();
  await db.update(produtos).set({ ativo }).where(eq(produtos.id, id));
  revalidatePath("/admin/produtos");
  return { ok: true };
}

/** Upload disparado pelo formulário; devolve a URL pública para o rascunho. */
export async function enviarImagem(formData: FormData): Promise<{ url?: string; erro?: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { erro: "Arquivo inválido." };
  }

  try {
    return { url: await uploadImagem(file, "produtos") };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha no upload." };
  }
}

export async function listarCategoriasAtivas() {
  await requireAdmin();
  return db
    .select({ id: categorias.id, nome: categorias.nome })
    .from(categorias)
    .where(eq(categorias.ativo, true))
    .orderBy(asc(categorias.ordem), asc(categorias.nome));
}

/** Remove do bucket imagens que saíram do rascunho sem serem salvas. */
export async function descartarImagens(urls: string[]): Promise<void> {
  await requireAdmin();
  const emUso = urls.length
    ? await db
        .select({ url: produtosImagens.url })
        .from(produtosImagens)
        .where(inArray(produtosImagens.url, urls))
    : [];
  const usadas = new Set(emUso.map((i) => i.url));
  await Promise.all(urls.filter((u) => !usadas.has(u)).map((u) => removerImagem(u)));
}
