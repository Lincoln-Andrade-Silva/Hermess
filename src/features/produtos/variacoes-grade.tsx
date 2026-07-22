"use client";

import { useState } from "react";
import { Layers, Wand2 } from "lucide-react";
import { Button, Input, Label, Toggle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import type { EixoRascunho, VariacaoRascunho } from "./grade";

/**
 * Tabela editável da grade: uma linha por combinação. É onde o lojista passa
 * a maior parte do tempo, então tudo é editável em linha, sem modal.
 */
export function VariacoesGrade({
  eixos,
  variacoes,
  onChange,
  taxaGateway,
}: {
  eixos: EixoRascunho[];
  variacoes: VariacaoRascunho[];
  onChange: (variacoes: VariacaoRascunho[]) => void;
  taxaGateway: number;
}) {
  const [massaPreco, setMassaPreco] = useState("");
  const [massaEstoque, setMassaEstoque] = useState("");

  if (variacoes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line2 bg-surface/30 px-6 py-10 text-center">
        <Layers className="h-6 w-6 text-muted2" strokeWidth={1.5} />
        <p className="text-sm font-medium text-ink">Nenhuma variação ainda</p>
        <p className="max-w-xs text-xs text-muted">
          Adicione uma variação acima e a tabela aparece aqui. Sem variação o produto não pode ser
          vendido.
        </p>
      </div>
    );
  }

  function atualizar(indice: number, parcial: Partial<VariacaoRascunho>) {
    onChange(variacoes.map((v, i) => (i === indice ? { ...v, ...parcial } : v)));
  }

  function aplicarEmMassa() {
    const preco = massaPreco.trim();
    const estoque = massaEstoque.trim();
    if (!preco && !estoque) return;

    onChange(
      variacoes.map((v) => ({
        ...v,
        preco: preco || v.preco,
        estoque: estoque || v.estoque,
      })),
    );
    setMassaPreco("");
    setMassaEstoque("");
  }

  const eixosValidos = eixos.filter((e) => e.nome.trim());
  // Mapa valor -> hex, para pintar o swatch na célula da combinação.
  const hexPorValor = new Map(
    eixosValidos
      .filter((e) => e.tipo === "cor")
      .flatMap((e) => e.valores.map((v) => [`${e.nome}:${v.valor}`, v.hex] as const)),
  );

  const estoqueTotal = variacoes.reduce((soma, v) => soma + (Number(v.estoque) || 0), 0);
  const ativas = variacoes.filter((v) => v.ativo).length;
  const esgotadas = variacoes.filter((v) => (Number(v.estoque) || 0) === 0).length;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-line">
        {variacoes.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface/40 px-4 py-2.5">
            <span className="shrink-0 text-xs font-medium text-muted">Preencher todas</span>
            <div className="relative w-28 shrink-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted2">
                R$
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={massaPreco}
                onChange={(e) => setMassaPreco(e.target.value)}
                placeholder="preço"
                aria-label="Preço para todas as variações"
                className="h-9 pl-8 pr-2 text-sm"
              />
            </div>
            <Input
              type="number"
              min={0}
              value={massaEstoque}
              onChange={(e) => setMassaEstoque(e.target.value)}
              placeholder="estoque"
              aria-label="Estoque para todas as variações"
              className="h-9 w-24 shrink-0 px-2.5 text-sm"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={aplicarEmMassa}
              disabled={!massaPreco.trim() && !massaEstoque.trim()}
              className="h-9 shrink-0"
            >
              <Wand2 className="h-4 w-4" />
              Aplicar
            </Button>
          </div>
        )}

        {/* Mobile: cada variação vira um cartão. Tabela com scroll horizontal
            é inviável para editar preço e estoque com o polegar. */}
        <div className="divide-y divide-line sm:hidden">
          {variacoes.map((variacao, i) => {
            const semEstoque = (Number(variacao.estoque) || 0) === 0;

            return (
              <div key={i} className={cn("space-y-3 p-4", !variacao.ativo && "opacity-50")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {eixosValidos.map((eixo) => {
                      const valor = variacao.combinacao[eixo.nome];
                      const hex = hexPorValor.get(`${eixo.nome}:${valor}`);
                      return (
                        <span
                          key={eixo.nome}
                          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink"
                        >
                          {hex && (
                            <span
                              aria-hidden
                              style={{ backgroundColor: hex }}
                              className="h-3 w-3 rounded-full border border-line2"
                            />
                          )}
                          {valor ?? "—"}
                        </span>
                      );
                    })}
                  </div>
                  <Toggle
                    on={variacao.ativo}
                    onClick={() => atualizar(i, { ativo: !variacao.ativo })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`m-preco-${i}`}>Preço</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted2">
                        R$
                      </span>
                      <Input
                        id={`m-preco-${i}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={variacao.preco}
                        onChange={(e) => atualizar(i, { preco: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`m-estoque-${i}`}>Estoque</Label>
                    <Input
                      id={`m-estoque-${i}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={variacao.estoque}
                      onChange={(e) => atualizar(i, { estoque: e.target.value })}
                      className={cn(semEstoque && "border-amber-500/40 bg-amber-50")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`m-sku-${i}`}>SKU</Label>
                  <Input
                    id={`m-sku-${i}`}
                    value={variacao.sku}
                    onChange={(e) => atualizar(i, { sku: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60">
                {eixosValidos.map((eixo) => (
                  <th
                    key={eixo.nome}
                    className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted2"
                  >
                    {eixo.nome}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted2">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted2">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted2">
                  Estoque
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted2">
                  Ativa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {variacoes.map((variacao, i) => {
                const semEstoque = (Number(variacao.estoque) || 0) === 0;

                return (
                  <tr
                    key={i}
                    className={cn(
                      "transition hover:bg-surface/40",
                      !variacao.ativo && "opacity-50",
                    )}
                  >
                    {eixosValidos.map((eixo) => {
                      const valor = variacao.combinacao[eixo.nome];
                      const hex = hexPorValor.get(`${eixo.nome}:${valor}`);

                      return (
                        <td key={eixo.nome} className="whitespace-nowrap px-4 py-2.5">
                          <span className="flex items-center gap-2 font-medium text-ink">
                            {hex && (
                              <span
                                aria-hidden
                                style={{ backgroundColor: hex }}
                                className="h-4 w-4 shrink-0 rounded-full border border-line2"
                              />
                            )}
                            {valor ?? "—"}
                          </span>
                        </td>
                      );
                    })}

                    <td className="px-4 py-2.5">
                      <Input
                        value={variacao.sku}
                        onChange={(e) => atualizar(i, { sku: e.target.value })}
                        aria-label="SKU"
                        className="h-9 w-36 px-2.5 font-mono text-xs"
                      />
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="relative w-28">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted2">
                          R$
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variacao.preco}
                          onChange={(e) => atualizar(i, { preco: e.target.value })}
                          aria-label="Preço"
                          className="h-9 pl-8 pr-2 text-sm"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={variacao.estoque}
                          onChange={(e) => atualizar(i, { estoque: e.target.value })}
                          aria-label="Estoque"
                          className={cn(
                            "h-9 w-20 px-2.5 text-sm",
                            semEstoque && "border-amber-500/40 bg-amber-50",
                          )}
                        />
                        {semEstoque && (
                          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">
                            esgotado
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <Toggle
                          on={variacao.ativo}
                          onClick={() => atualizar(i, { ativo: !variacao.ativo })}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Resumo rotulo="Variações" valor={String(variacoes.length)} nota={`${ativas} ativas`} />
        <Resumo
          rotulo="Estoque"
          valor={String(estoqueTotal)}
          nota={
            esgotadas > 0 ? `${esgotadas} esgotada${esgotadas === 1 ? "" : "s"}` : "tudo com saldo"
          }
          alerta={esgotadas > 0}
        />
      </div>

      <NotaLiquido variacoes={variacoes} taxaGateway={taxaGateway} />
    </div>
  );
}

/** Quanto o lojista recebe por venda, já descontada a taxa do gateway. */
function NotaLiquido({
  variacoes,
  taxaGateway,
}: {
  variacoes: VariacaoRascunho[];
  taxaGateway: number;
}) {
  if (taxaGateway <= 0) return null;

  const precos = variacoes
    .map((v) => Number(v.preco))
    .filter((p) => Number.isFinite(p) && p > 0);
  if (precos.length === 0) return null;

  const fator = 1 - taxaGateway / 100;
  const menor = Math.min(...precos) * fator;
  const maior = Math.max(...precos) * fator;
  const taxaFmt = taxaGateway.toString().replace(".", ",");
  const faixa = menor === maior ? formatBRL(menor) : `${formatBRL(menor)}–${formatBRL(maior)}`;

  return (
    <p className="rounded-xl border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
      Com a taxa de {taxaFmt}% do Mercado Pago, você recebe{" "}
      <span className="font-semibold">{faixa}</span> por venda online. No balcão, o valor é integral.
    </p>
  );
}

function Resumo({
  rotulo,
  valor,
  nota,
  alerta,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted2">{rotulo}</p>
      <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">{valor}</p>
      {nota && (
        <p className={cn("text-xs", alerta ? "text-amber-700" : "text-muted")}>{nota}</p>
      )}
    </div>
  );
}
