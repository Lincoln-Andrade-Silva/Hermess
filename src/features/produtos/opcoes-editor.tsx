"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button, ColorPicker, Input, Label, Segmented } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { EixoRascunho } from "./grade";

const HEX_PADRAO = "#111111";

/**
 * Editor dos tipos de variação (Cor, Tamanho, Voltagem...). O tipo `cor`
 * habilita o seletor de hex, que é o que permite renderizar swatch e trocar a
 * galeria na vitrine - por isso ele vive na opção e não na variação.
 *
 * Cada bloco colapsa: num produto já cadastrado o interessante é a grade,
 * não os eixos que raramente mudam.
 */
export function OpcoesEditor({
  eixos,
  onChange,
  iniciarMinimizado = false,
}: {
  eixos: EixoRascunho[];
  onChange: (eixos: EixoRascunho[]) => void;
  iniciarMinimizado?: boolean;
}) {
  const [abertos, setAbertos] = useState<Set<number>>(() =>
    iniciarMinimizado ? new Set() : new Set(eixos.map((_, i) => i)),
  );

  function alternar(indice: number) {
    setAbertos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(indice)) proximo.delete(indice);
      else proximo.add(indice);
      return proximo;
    });
  }

  function atualizar(indice: number, parcial: Partial<EixoRascunho>) {
    onChange(eixos.map((e, i) => (i === indice ? { ...e, ...parcial } : e)));
  }

  function remover(indice: number) {
    onChange(eixos.filter((_, i) => i !== indice));
    // Os blocos são identificados por índice, então tudo que vinha depois do
    // removido desloca uma posição.
    setAbertos((atual) => {
      const proximo = new Set<number>();
      atual.forEach((i) => {
        if (i < indice) proximo.add(i);
        else if (i > indice) proximo.add(i - 1);
      });
      return proximo;
    });
  }

  function adicionar() {
    onChange([
      ...eixos,
      {
        nome: "",
        tipo: eixos.length === 0 ? "cor" : "texto",
        valores: [{ valor: "", hex: eixos.length === 0 ? HEX_PADRAO : undefined }],
      },
    ]);
    setAbertos((atual) => new Set(atual).add(eixos.length));
  }

  function trocarTipo(indice: number, tipo: "texto" | "cor") {
    const eixo = eixos[indice];
    atualizar(indice, {
      tipo,
      valores: eixo.valores.map((v) => ({
        valor: v.valor,
        hex: tipo === "cor" ? (v.hex ?? HEX_PADRAO) : undefined,
      })),
    });
  }

  return (
    <div className="space-y-3">
      {eixos.map((eixo, i) => {
        const aberto = abertos.has(i);
        const preenchidos = eixo.valores.filter((v) => v.valor.trim());

        return (
          <div key={i} className="overflow-hidden rounded-xl border border-line">
            <div className="flex items-center gap-2 bg-surface/50 px-3 py-2.5">
              <button
                type="button"
                onClick={() => alternar(i)}
                aria-expanded={aberto}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted transition",
                    aberto && "rotate-180",
                  )}
                />
                <span className="truncate text-sm font-semibold text-ink">
                  {eixo.nome.trim() || "Sem nome"}
                </span>
                {!aberto && preenchidos.length > 0 && (
                  <span className="truncate text-xs text-muted">
                    {preenchidos.map((v) => v.valor).join(", ")}
                  </span>
                )}
                {!aberto && preenchidos.length === 0 && (
                  <span className="text-xs text-muted2">sem valores</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => remover(i)}
                aria-label={`Remover ${eixo.nome.trim() || "variação"}`}
                className="shrink-0 rounded-lg p-1.5 text-muted transition hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {aberto && (
              <div className="space-y-3 border-t border-line p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-40 flex-1 space-y-2">
                    <Label htmlFor={`eixo-${i}`}>Tipo de variação</Label>
                    <Input
                      id={`eixo-${i}`}
                      value={eixo.nome}
                      onChange={(e) => atualizar(i, { nome: e.target.value })}
                      placeholder="Cor, Tamanho, Voltagem..."
                    />
                  </div>
                  <Segmented
                    value={eixo.tipo}
                    onChange={(tipo) => trocarTipo(i, tipo)}
                    options={[
                      { value: "texto", label: "Texto" },
                      { value: "cor", label: "Cor" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valores</Label>
                  {eixo.valores.map((valor, v) => (
                    <div key={v} className="flex items-center gap-2">
                      {eixo.tipo === "cor" && (
                        <ColorPicker
                          value={valor.hex ?? HEX_PADRAO}
                          rotulo={valor.valor}
                          onChange={(hex) =>
                            atualizar(i, {
                              valores: eixo.valores.map((x, y) => (y === v ? { ...x, hex } : x)),
                            })
                          }
                        />
                      )}
                      <Input
                        value={valor.valor}
                        onChange={(e) =>
                          atualizar(i, {
                            valores: eixo.valores.map((x, y) =>
                              y === v ? { ...x, valor: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Valor"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          atualizar(i, { valores: eixo.valores.filter((_, y) => y !== v) })
                        }
                        aria-label={`Remover valor ${valor.valor || v + 1}`}
                        className="rounded-lg p-2 text-muted2 transition hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      atualizar(i, {
                        valores: [
                          ...eixo.valores,
                          { valor: "", hex: eixo.tipo === "cor" ? HEX_PADRAO : undefined },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar valor
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {eixos.length < 3 && (
        <Button variant="secondary" onClick={adicionar}>
          <Plus className="h-4 w-4" />
          Adicionar variação
        </Button>
      )}
      {eixos.length >= 3 && (
        <p className="text-xs text-muted">
          Limite de 3 tipos de variação. Acima disso a grade vira centenas de linhas e o cadastro
          fica impraticável.
        </p>
      )}
    </div>
  );
}
