"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  pedidoItens,
  pedidos,
  produtos,
  produtosVariacoes,
  type Combinacao,
  type Pedido,
} from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";
import { RESERVA_MINUTOS } from "./constants";
import { selecionarItensComImagem, type ItemComImagem } from "./itens";
import { liberarReservasVencidas } from "./reserva";

const itemSchema = z.object({
  variacaoId: z.string().uuid(),
  quantidade: z.number().int().positive().max(99),
});

const checkoutSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(120),
  telefone: z.string().trim().min(8, "Informe um telefone válido.").max(30),
  itens: z.array(itemSchema).min(1, "Sua sacola está vazia."),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

export type ResultadoCheckout =
  | { ok: true; numero: number }
  | { ok: false; erro: string };

/** Rollback com mensagem para o cliente quando o estoque não cobre o item. */
class IndisponivelError extends Error {}

export async function finalizarPedido(input: CheckoutInput): Promise<ResultadoCheckout> {
  const profile = await getCurrentProfile();

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, telefone, itens } = parsed.data;

  // Uma variação não pode aparecer duas vezes — some as quantidades antes.
  const somados = new Map<string, number>();
  for (const item of itens) {
    somados.set(item.variacaoId, (somados.get(item.variacaoId) ?? 0) + item.quantidade);
  }
  const linhas = [...somados.entries()].map(([variacaoId, quantidade]) => ({
    variacaoId,
    quantidade,
  }));

  try {
    const numero = await db.transaction(async (tx) => {
      // Libera vencidos antes de disputar o saldo.
      await liberarReservasVencidas(tx);

      const encontradas = await tx
        .select({
          id: produtosVariacoes.id,
          sku: produtosVariacoes.sku,
          preco: produtosVariacoes.preco,
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

      const mapa = new Map(encontradas.map((v) => [v.id, v]));

      let total = 0;
      for (const linha of linhas) {
        const v = mapa.get(linha.variacaoId);
        if (!v || !v.ativo) {
          throw new IndisponivelError("Um item da sacola não está mais disponível.");
        }

        // UPDATE condicional: só reserva se o disponível cobre, e o WHERE
        // trava a linha — dois checkouts pela última unidade não passam ambos.
        const reservada = await tx
          .update(produtosVariacoes)
          .set({ reservado: sql`${produtosVariacoes.reservado} + ${linha.quantidade}` })
          .where(
            and(
              eq(produtosVariacoes.id, linha.variacaoId),
              sql`(${produtosVariacoes.estoque} - ${produtosVariacoes.reservado}) >= ${linha.quantidade}`,
            ),
          )
          .returning({ id: produtosVariacoes.id });

        if (reservada.length === 0) {
          throw new IndisponivelError(`Estoque insuficiente para ${v.nomeProduto}.`);
        }

        total += Number(v.preco) * linha.quantidade;
      }

      const expiraEm = new Date(Date.now() + RESERVA_MINUTOS * 60_000);

      const [pedido] = await tx
        .insert(pedidos)
        .values({
          clienteId: profile.id,
          nome,
          telefone,
          total: total.toFixed(2),
          expiraEm,
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

      return pedido.numero;
    });

    return { ok: true, numero };
  } catch (e) {
    if (e instanceof IndisponivelError) return { ok: false, erro: e.message };
    throw e;
  }
}

export interface PedidoComItens {
  numero: number;
  status: Pedido["status"];
  nome: string;
  telefone: string;
  total: string;
  expiraEm: Date;
  criadoEm: Date;
  itens: ItemComImagem[];
}

/** Pedido do cliente logado por número. Nulo se não existe ou não é dele. */
export async function buscarMeuPedido(numero: number): Promise<PedidoComItens | null> {
  const profile = await getCurrentProfile();
  await liberarReservasVencidas();

  const [pedido] = await db
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.numero, numero), eq(pedidos.clienteId, profile.id)));
  if (!pedido) return null;

  const itens = await selecionarItensComImagem(pedido.id);

  return {
    numero: pedido.numero,
    status: pedido.status,
    nome: pedido.nome,
    telefone: pedido.telefone,
    total: pedido.total,
    expiraEm: pedido.expiraEm,
    criadoEm: pedido.criadoEm,
    itens,
  };
}

export interface PedidoResumo {
  numero: number;
  status: Pedido["status"];
  total: string;
  criadoEm: Date;
  quantidadeItens: number;
}

/** Histórico de pedidos do cliente logado, mais recentes primeiro. */
export async function listarMeusPedidos(): Promise<PedidoResumo[]> {
  const profile = await getCurrentProfile();
  await liberarReservasVencidas();

  return db
    .select({
      numero: pedidos.numero,
      status: pedidos.status,
      total: pedidos.total,
      criadoEm: pedidos.criadoEm,
      quantidadeItens: sql<number>`cast(coalesce(sum(${pedidoItens.quantidade}), 0) as int)`,
    })
    .from(pedidos)
    .leftJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
    .where(eq(pedidos.clienteId, profile.id))
    .groupBy(pedidos.id)
    .orderBy(desc(pedidos.criadoEm));
}
