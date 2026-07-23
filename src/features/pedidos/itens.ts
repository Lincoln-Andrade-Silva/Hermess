import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  pedidoItens,
  produtos,
  produtosImagens,
  produtosVariacoes,
  type Combinacao,
} from "@/db/schema";

export interface ItemComImagem {
  nomeProduto: string;
  sku: string;
  combinacao: Combinacao;
  precoUnitario: string;
  quantidade: number;
  imagem: string | null;
  /** Slug do produto quando ainda existe e está ativo - para linkar à vitrine. */
  slug: string | null;
}

/**
 * Itens do pedido com a imagem para exibição: a da variação comprada, ou a
 * primeira foto do produto quando a variação não tem imagem própria. Nula se a
 * variação foi excluída depois da compra.
 */
export async function selecionarItensComImagem(pedidoId: string): Promise<ItemComImagem[]> {
  return db
    .select({
      nomeProduto: pedidoItens.nomeProduto,
      sku: pedidoItens.sku,
      combinacao: pedidoItens.combinacao,
      precoUnitario: pedidoItens.precoUnitario,
      quantidade: pedidoItens.quantidade,
      imagem: sql<string | null>`coalesce(
        (select vv.imagem_url from ${produtosVariacoes} vv where vv.id = ${pedidoItens.variacaoId}),
        (select pi.url from ${produtosImagens} pi
           where pi.produto_id = (
             select vv2.produto_id from ${produtosVariacoes} vv2 where vv2.id = ${pedidoItens.variacaoId}
           )
           order by pi.ordem asc limit 1)
      )`,
      slug: sql<string | null>`(
        select p.slug from ${produtos} p
        join ${produtosVariacoes} vs on vs.produto_id = p.id
        where vs.id = ${pedidoItens.variacaoId} and p.ativo
      )`,
    })
    .from(pedidoItens)
    .where(eq(pedidoItens.pedidoId, pedidoId));
}
