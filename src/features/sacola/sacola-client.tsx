"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Minus, Phone, Plus, ShoppingBag, Trash2, User } from "lucide-react";
import { formatBRL, maskTelefone } from "@/lib/format";
import { Button, Field, FormError, Input } from "@/components/ui";
import { finalizarPedido } from "@/features/pedidos/actions";
import { RESERVA_MINUTOS } from "@/features/pedidos/constants";
import { useSacola, type ItemSacola } from "./sacola-context";

interface Cliente {
  nome: string;
  telefone: string;
  email: string;
}

function descreverCombinacao(item: ItemSacola): string {
  return Object.values(item.combinacao).join(" · ");
}

export function SacolaClient({ cliente }: { cliente: Cliente | null }) {
  const router = useRouter();
  const { itens, pronto, subtotal, definirQuantidade, remover, limpar } = useSacola();
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  // Cadastro sem telefone: é o único dado que ainda precisamos pedir.
  const precisaTelefone = Boolean(cliente) && !cliente!.telefone.trim();

  function finalizar() {
    setErro(null);
    iniciar(async () => {
      const r = await finalizarPedido({
        telefone: precisaTelefone ? telefone : undefined,
        itens: itens.map((i) => ({ variacaoId: i.variacaoId, quantidade: i.quantidade })),
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      limpar();
      router.push(`/pedido/${r.numero}`);
    });
  }

  // Antes de hidratar não dá pra saber se a sacola tem itens - evita piscar o vazio.
  if (!pronto) {
    return <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6" />;
  }

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted2" strokeWidth={1.3} />
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-wide text-ink">
          Sua sacola está vazia
        </h1>
        <p className="mt-2 text-sm text-muted">Adicione produtos para finalizar o pedido.</p>
        <Link
          href="/produtos"
          className="mt-6 inline-flex items-center rounded-full bg-ink px-7 py-3 font-display text-sm font-bold uppercase tracking-wide text-bg transition hover:bg-brand-dark"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-8 font-display text-3xl font-extrabold uppercase tracking-wide text-ink sm:text-4xl">
        Sacola
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Itens */}
        <ul className="min-w-0 space-y-4">
          {itens.map((item) => (
            <li
              key={item.variacaoId}
              className="flex gap-4 rounded-2xl border border-line p-3 sm:p-4"
            >
              <Link
                href={`/produto/${item.produtoSlug}`}
                className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg bg-surface sm:w-24"
              >
                {item.imagem ? (
                  <Image src={item.imagem} alt="" fill sizes="96px" className="object-cover object-top" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-muted2">
                    sem imagem
                  </span>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/produto/${item.produtoSlug}`}
                  className="font-display text-lg font-bold uppercase leading-tight tracking-wide text-ink transition hover:text-brand"
                >
                  {item.produtoNome}
                </Link>
                {descreverCombinacao(item) && (
                  <p className="mt-0.5 text-xs text-muted">{descreverCombinacao(item)}</p>
                )}
                <p className="mt-1 text-sm font-semibold text-ink">{formatBRL(item.preco)}</p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border border-line">
                    <button
                      type="button"
                      onClick={() => definirQuantidade(item.variacaoId, item.quantidade - 1)}
                      aria-label="Diminuir quantidade"
                      className="p-2 text-muted transition hover:text-ink"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => definirQuantidade(item.variacaoId, item.quantidade + 1)}
                      aria-label="Aumentar quantidade"
                      className="p-2 text-muted transition hover:text-ink"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remover(item.variacaoId)}
                    aria-label="Remover item"
                    className="rounded-lg p-2 text-muted transition hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Resumo e checkout */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-line p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-ink">{formatBRL(subtotal)}</span>
            </div>
            <p className="text-xs text-muted">Retirada no local · sem frete.</p>

            <div className="border-t border-line pt-4">
              {cliente ? (
                <div className="space-y-3">
                  {/* Dados do cadastro - informativo, sem edição. */}
                  <div className="space-y-2 rounded-xl bg-surface/50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted2">
                      Retirada em nome de
                    </p>
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <User className="h-4 w-4 shrink-0 text-muted2" />
                      {cliente.nome}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <Mail className="h-4 w-4 shrink-0 text-muted2" />
                      {cliente.email}
                    </p>
                    {cliente.telefone.trim() && (
                      <p className="flex items-center gap-2 text-sm text-muted">
                        <Phone className="h-4 w-4 shrink-0 text-muted2" />
                        {maskTelefone(cliente.telefone)}
                      </p>
                    )}
                  </div>

                  {precisaTelefone && (
                    <Field label="Telefone / WhatsApp" htmlFor="sac-telefone" hint="(para contato)">
                      <Input
                        id="sac-telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        maxLength={16}
                      />
                    </Field>
                  )}

                  {erro && <FormError>{erro}</FormError>}

                  <Button className="w-full py-3" onClick={finalizar} disabled={enviando}>
                    {enviando ? "Finalizando..." : "Finalizar pedido"}
                  </Button>
                  <p className="text-center text-[11px] text-muted2">
                    O pedido reserva o estoque por {RESERVA_MINUTOS} minutos até o pagamento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted">
                    Entre na sua conta para finalizar. Sua sacola fica salva.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-ink py-3 font-display text-sm font-bold uppercase tracking-wide text-bg transition hover:bg-brand-dark"
                  >
                    Entrar para finalizar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
