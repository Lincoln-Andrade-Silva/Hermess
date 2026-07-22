"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui";
import type { Combinacao } from "@/db/schema";
import { useSacola } from "@/features/sacola/sacola-context";
import type { ProdutoDetalhe } from "./queries";

/**
 * Seleção de variação na página do produto. Regras que importam:
 *
 * - Cada eixo tem um valor selecionado; a variação é a combinação dos três.
 * - Selecionar uma cor troca a galeria quando aquela variação tem imagem
 *   própria — o que faz o swatch parecer "vestir" a peça.
 * - Valor sem nenhuma variação disponível aparece riscado, não some: comunica
 *   que a peça existe naquele tamanho, só está sem saldo.
 */
export function ProdutoDetalhe({ produto }: { produto: ProdutoDetalhe }) {
  const { adicionar } = useSacola();
  const [selecao, setSelecao] = useState<Combinacao>(() => selecaoInicial(produto));
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [adicionado, setAdicionado] = useState(false);

  // Some o "adicionado" depois de um instante.
  useEffect(() => {
    if (!adicionado) return;
    const t = setTimeout(() => setAdicionado(false), 2000);
    return () => clearTimeout(t);
  }, [adicionado]);

  // A variação exata que casa com a seleção atual, se existir.
  const variacaoAtual = useMemo(
    () =>
      produto.variacoes.find((v) =>
        produto.opcoes.every((o) => v.combinacao[o.nome] === selecao[o.nome]),
      ),
    [produto, selecao],
  );

  // Galeria: usa a imagem da variação selecionada quando ela tem uma própria,
  // senão as imagens gerais do produto.
  const galeria = useMemo(() => {
    if (variacaoAtual?.imagemUrl) {
      const resto = produto.imagens.filter((url) => url !== variacaoAtual.imagemUrl);
      return [variacaoAtual.imagemUrl, ...resto];
    }
    return produto.imagens;
  }, [variacaoAtual, produto.imagens]);

  function selecionar(eixo: string, valor: string) {
    setSelecao((atual) => ({ ...atual, [eixo]: valor }));
    setImagemAtiva(0);
  }

  /** Um valor está disponível se alguma variação com saldo o contém. */
  function disponivel(eixo: string, valor: string): boolean {
    return produto.variacoes.some((v) => v.combinacao[eixo] === valor && v.disponivel);
  }

  const semSelecaoCompleta = produto.opcoes.some((o) => !selecao[o.nome]);
  const indisponivel = !variacaoAtual || !variacaoAtual.disponivel;

  function adicionarNaSacola() {
    if (!variacaoAtual || indisponivel) return;
    adicionar({
      variacaoId: variacaoAtual.id,
      produtoNome: produto.nome,
      produtoSlug: produto.slug,
      combinacao: variacaoAtual.combinacao,
      preco: variacaoAtual.preco,
      imagem: galeria[0] ?? null,
    });
    setAdicionado(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Galeria */}
      <div className="min-w-0 space-y-3">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface">
          {galeria[imagemAtiva] ? (
            <Image
              src={galeria[imagemAtiva]}
              alt={produto.nome}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted2">
              sem imagem
            </div>
          )}
        </div>

        {galeria.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {galeria.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setImagemAtiva(i)}
                aria-label={`Imagem ${i + 1}`}
                className={cn(
                  "relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition",
                  i === imagemAtiva ? "border-ink" : "border-transparent hover:border-line2",
                )}
              >
                <Image src={url} alt="" fill sizes="20vw" className="object-cover object-top" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Informações e seleção */}
      <div className="min-w-0 lg:py-2">
        {produto.categoriaNome && (
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
            {produto.categoriaNome}
          </p>
        )}

        <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide text-ink [overflow-wrap:anywhere] sm:text-4xl">
          {produto.nome}
        </h1>

        <p className="mt-4 text-2xl font-semibold text-ink">
          {variacaoAtual ? formatBRL(variacaoAtual.preco) : formatBRL(menorPreco(produto))}
        </p>

        <div className="mt-6 space-y-5">
          {produto.opcoes.map((opcao) => (
            <div key={opcao.nome} className="space-y-2">
              <p className="text-sm font-medium text-ink">
                {opcao.nome}
                {selecao[opcao.nome] && (
                  <span className="ml-1.5 font-normal text-muted">{selecao[opcao.nome]}</span>
                )}
              </p>

              <div className="flex flex-wrap gap-2">
                {opcao.valores.map((valor) => {
                  const ativo = selecao[opcao.nome] === valor.valor;
                  const temSaldo = disponivel(opcao.nome, valor.valor);

                  if (opcao.tipo === "cor") {
                    return (
                      <button
                        key={valor.valor}
                        type="button"
                        onClick={() => selecionar(opcao.nome, valor.valor)}
                        aria-pressed={ativo}
                        title={valor.valor}
                        className={cn(
                          "relative h-10 w-10 rounded-full border-2 transition",
                          ativo ? "border-ink" : "border-line hover:border-line2",
                          !temSaldo && "opacity-40",
                        )}
                      >
                        <span
                          style={{ backgroundColor: valor.hex }}
                          className="absolute inset-1 rounded-full border border-line2"
                        />
                        {!temSaldo && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="h-px w-8 rotate-45 bg-ink/60" />
                          </span>
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={valor.valor}
                      type="button"
                      onClick={() => selecionar(opcao.nome, valor.valor)}
                      aria-pressed={ativo}
                      className={cn(
                        "min-w-12 rounded-lg border px-4 py-2.5 text-sm font-medium transition",
                        ativo
                          ? "border-ink bg-ink text-bg"
                          : temSaldo
                            ? "border-line text-ink hover:border-line2"
                            : "border-line text-muted2 line-through",
                      )}
                    >
                      {valor.valor}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button
            className="w-full py-4 text-base"
            disabled={semSelecaoCompleta || indisponivel}
            onClick={adicionarNaSacola}
          >
            {adicionado ? (
              <>
                <Check className="h-5 w-5" />
                Adicionado à sacola
              </>
            ) : semSelecaoCompleta ? (
              "Selecione as opções"
            ) : indisponivel ? (
              "Esgotado"
            ) : (
              "Adicionar à sacola"
            )}
          </Button>
          {!semSelecaoCompleta && indisponivel && (
            <p className="mt-2 text-center text-xs text-muted">
              Esta combinação está sem estoque no momento.
            </p>
          )}
        </div>

        {produto.descricao && (
          <div className="mt-8 border-t border-line pt-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {produto.descricao}
            </p>
          </div>
        )}

        {produto.fichaTecnica && produto.fichaTecnica.linhas.length > 0 && (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="mb-3 font-display text-lg font-extrabold uppercase tracking-wide text-ink">
              {produto.fichaTecnica.titulo}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface/60">
                  <tr>
                    {produto.fichaTecnica.colunas.map((coluna, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted2"
                      >
                        {coluna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {produto.fichaTecnica.linhas.map((linha, i) => (
                    <tr key={i}>
                      {produto.fichaTecnica!.colunas.map((_, c) => (
                        <td key={c} className="whitespace-nowrap px-4 py-2.5 text-ink">
                          {linha[c] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Pré-seleciona a primeira cor com saldo; os demais eixos ficam em aberto. */
function selecaoInicial(produto: ProdutoDetalhe): Combinacao {
  const eixoCor = produto.opcoes.find((o) => o.tipo === "cor");
  if (!eixoCor) return {};

  const comSaldo = eixoCor.valores.find((v) =>
    produto.variacoes.some((x) => x.combinacao[eixoCor.nome] === v.valor && x.disponivel),
  );
  const escolhida = comSaldo ?? eixoCor.valores[0];
  return escolhida ? { [eixoCor.nome]: escolhida.valor } : {};
}

function menorPreco(produto: ProdutoDetalhe): string {
  const precos = produto.variacoes.map((v) => Number(v.preco));
  return precos.length ? String(Math.min(...precos)) : "0";
}
