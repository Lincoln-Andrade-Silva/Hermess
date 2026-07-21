import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categorias,
  produtos,
  produtosImagens,
  produtosOpcoes,
  produtosVariacoes,
  type Combinacao,
  type FichaTecnica,
  type ValorOpcao,
} from "@/db/schema";
import { offsetDaPagina, totalPaginas } from "@/lib/pagination";

/** Itens por página da vitrine. Múltiplo de 2, 3 e 4 para fechar as grades. */
export const VITRINE_PAGE_SIZE = 12;

export interface ProdutoVitrine {
  id: string;
  nome: string;
  slug: string;
  categoriaNome: string | null;
  capa: string | null;
  /** Segunda imagem: é ela que aparece no hover do card. */
  verso: string | null;
  precoMin: string;
  precoMax: string;
  /** Valores do primeiro eixo do tipo cor, para os swatches no card. */
  cores: ValorOpcao[];
  /** Valores do primeiro eixo de texto, com a disponibilidade de cada um. */
  tamanhos: { valor: string; disponivel: boolean }[];
  disponivel: boolean;
}

/**
 * Disponível para venda = estoque - reservado. A reserva é da Fase 4, mas a
 * conta já entra aqui para a vitrine não prometer peça que está num checkout
 * aberto de outro cliente.
 */
const DISPONIVEL = sql`(${produtosVariacoes.estoque} - ${produtosVariacoes.reservado}) > 0`;

/** Produto tem ao menos uma variação ativa com saldo. */
const temSaldo = sql`exists (
  select 1 from ${produtosVariacoes} v
  where v.produto_id = ${produtos.id} and v.ativo and (v.estoque - v.reservado) > 0
)`;

interface FiltrosVitrine {
  categoria?: string;
  /** Pares "Eixo:Valor" — ex: ["Cor:Preto", "Tamanho:P"]. */
  valores?: string[];
  ordem?: "recentes" | "menor-preco" | "maior-preco" | "nome";
  page?: number;
}

function condicaoValores(valores: string[]) {
  // Cada filtro vira um EXISTS próprio: "Preto E tamanho P" precisa existir
  // numa mesma variação por eixo, não em variações diferentes.
  return valores.map((par) => {
    const separador = par.indexOf(":");
    if (separador < 1) return sql`true`;
    const eixo = par.slice(0, separador);
    const valor = par.slice(separador + 1);
    const alvo = JSON.stringify({ [eixo]: valor });

    return sql`exists (
      select 1 from ${produtosVariacoes} v
      where v.produto_id = ${produtos.id} and v.ativo
        and (v.estoque - v.reservado) > 0
        and v.combinacao @> ${alvo}::jsonb
    )`;
  });
}

export async function listarVitrine(filtros: FiltrosVitrine) {
  const page = Math.max(1, filtros.page ?? 1);

  const where = and(
    eq(produtos.ativo, true),
    filtros.categoria ? eq(categorias.slug, filtros.categoria) : undefined,
    ...condicaoValores(filtros.valores ?? []),
  );

  const ordenacao = {
    recentes: sql`${produtos.criadoEm} desc`,
    "menor-preco": sql`(select min(preco) from ${produtosVariacoes} v where v.produto_id = ${produtos.id} and v.ativo) asc`,
    "maior-preco": sql`(select max(preco) from ${produtosVariacoes} v where v.produto_id = ${produtos.id} and v.ativo) desc`,
    nome: sql`${produtos.nome} asc`,
  }[filtros.ordem ?? "recentes"];

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(produtos)
    .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(where);

  const linhas = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      slug: produtos.slug,
      categoriaNome: categorias.nome,
      capa: sql<string | null>`(
        select url from ${produtosImagens} i where i.produto_id = ${produtos.id}
        order by i.ordem limit 1
      )`,
      verso: sql<string | null>`(
        select url from ${produtosImagens} i where i.produto_id = ${produtos.id}
        order by i.ordem offset 1 limit 1
      )`,
      precoMin: sql<string>`coalesce((
        select min(preco)::text from ${produtosVariacoes} v
        where v.produto_id = ${produtos.id} and v.ativo
      ), '0')`,
      precoMax: sql<string>`coalesce((
        select max(preco)::text from ${produtosVariacoes} v
        where v.produto_id = ${produtos.id} and v.ativo
      ), '0')`,
      disponivel: sql<boolean>`${temSaldo}`,
    })
    .from(produtos)
    .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(where)
    .orderBy(ordenacao)
    .limit(VITRINE_PAGE_SIZE)
    .offset(offsetDaPagina(page, VITRINE_PAGE_SIZE));

  const itens = await enriquecerComOpcoes(linhas);

  return { itens, page, pageCount: totalPaginas(total, VITRINE_PAGE_SIZE) };
}

/**
 * Anexa cores e tamanhos aos produtos numa única ida ao banco, em vez de uma
 * consulta por card. Sem isso a home com 12 produtos faria 25 queries.
 */
async function enriquecerComOpcoes(
  linhas: Omit<ProdutoVitrine, "cores" | "tamanhos">[],
): Promise<ProdutoVitrine[]> {
  if (linhas.length === 0) return [];
  const ids = linhas.map((l) => l.id);

  const [opcoes, variacoes] = await Promise.all([
    db
      .select()
      .from(produtosOpcoes)
      .where(sql`${produtosOpcoes.produtoId} = any(${ids})`)
      .orderBy(asc(produtosOpcoes.ordem)),
    db
      .select({
        produtoId: produtosVariacoes.produtoId,
        combinacao: produtosVariacoes.combinacao,
        disponivel: sql<boolean>`${DISPONIVEL}`,
      })
      .from(produtosVariacoes)
      .where(and(sql`${produtosVariacoes.produtoId} = any(${ids})`, eq(produtosVariacoes.ativo, true))),
  ]);

  return linhas.map((linha) => {
    const doProduto = opcoes.filter((o) => o.produtoId === linha.id);
    const eixoCor = doProduto.find((o) => o.tipo === "cor");
    const eixoTexto = doProduto.find((o) => o.tipo === "texto");

    const tamanhos = eixoTexto
      ? eixoTexto.valores.map((v) => ({
          valor: v.valor,
          // Esgotado aparece riscado em vez de sumir: some comunica catálogo
          // furado, riscado comunica que a peça existe naquele tamanho.
          disponivel: variacoes.some(
            (x) =>
              x.produtoId === linha.id &&
              (x.combinacao as Combinacao)[eixoTexto.nome] === v.valor &&
              x.disponivel,
          ),
        }))
      : [];

    return { ...linha, cores: eixoCor?.valores ?? [], tamanhos };
  });
}

export interface ProdutoDetalhe {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoriaNome: string | null;
  categoriaSlug: string | null;
  fichaTecnica: FichaTecnica | null;
  imagens: string[];
  opcoes: { nome: string; tipo: "texto" | "cor"; valores: ValorOpcao[] }[];
  variacoes: {
    id: string;
    sku: string;
    preco: string;
    disponivel: boolean;
    imagemUrl: string | null;
    combinacao: Combinacao;
  }[];
}

export async function buscarProdutoPorSlug(slug: string): Promise<ProdutoDetalhe | null> {
  const [produto] = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      slug: produtos.slug,
      descricao: produtos.descricao,
      fichaTecnica: produtos.fichaTecnica,
      categoriaNome: categorias.nome,
      categoriaSlug: categorias.slug,
    })
    .from(produtos)
    .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(and(eq(produtos.slug, slug), eq(produtos.ativo, true)));

  if (!produto) return null;

  const [imagens, opcoes, variacoes] = await Promise.all([
    db
      .select({ url: produtosImagens.url })
      .from(produtosImagens)
      .where(eq(produtosImagens.produtoId, produto.id))
      .orderBy(asc(produtosImagens.ordem)),
    db
      .select()
      .from(produtosOpcoes)
      .where(eq(produtosOpcoes.produtoId, produto.id))
      .orderBy(asc(produtosOpcoes.ordem)),
    db
      .select({
        id: produtosVariacoes.id,
        sku: produtosVariacoes.sku,
        preco: produtosVariacoes.preco,
        imagemUrl: produtosVariacoes.imagemUrl,
        combinacao: produtosVariacoes.combinacao,
        disponivel: sql<boolean>`${DISPONIVEL}`,
      })
      .from(produtosVariacoes)
      .where(and(eq(produtosVariacoes.produtoId, produto.id), eq(produtosVariacoes.ativo, true))),
  ]);

  return {
    ...produto,
    imagens: imagens.map((i) => i.url),
    opcoes: opcoes.map((o) => ({ nome: o.nome, tipo: o.tipo, valores: o.valores })),
    variacoes,
  };
}

/** Categorias com produto ativo — as vazias não aparecem no menu da loja. */
export async function listarCategoriasComProduto() {
  return db
    .selectDistinct({ nome: categorias.nome, slug: categorias.slug, ordem: categorias.ordem })
    .from(categorias)
    .innerJoin(produtos, and(eq(produtos.categoriaId, categorias.id), eq(produtos.ativo, true)))
    .where(eq(categorias.ativo, true))
    .orderBy(asc(categorias.ordem), asc(categorias.nome));
}

/**
 * Valores disponíveis para filtrar, agrupados pelo nome do tipo de variação.
 * Sai dos produtos ativos, então um filtro nunca leva a resultado vazio.
 */
export async function listarFiltrosDisponiveis(categoria?: string) {
  const opcoes = await db
    .select({ nome: produtosOpcoes.nome, tipo: produtosOpcoes.tipo, valores: produtosOpcoes.valores })
    .from(produtosOpcoes)
    .innerJoin(produtos, and(eq(produtos.id, produtosOpcoes.produtoId), eq(produtos.ativo, true)))
    .leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(categoria ? eq(categorias.slug, categoria) : undefined)
    .orderBy(asc(produtosOpcoes.ordem));

  const agrupado = new Map<string, { tipo: "texto" | "cor"; valores: Map<string, ValorOpcao> }>();

  for (const opcao of opcoes) {
    const atual = agrupado.get(opcao.nome) ?? { tipo: opcao.tipo, valores: new Map() };
    for (const valor of opcao.valores) {
      if (valor.valor.trim()) atual.valores.set(valor.valor, valor);
    }
    agrupado.set(opcao.nome, atual);
  }

  return [...agrupado.entries()].map(([nome, { tipo, valores }]) => ({
    nome,
    tipo,
    valores: [...valores.values()],
  }));
}
