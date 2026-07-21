"use client";

import { Plus, Trash2 } from "lucide-react";
import type { FichaTecnica } from "@/db/schema";
import { Button, Input, Label } from "@/components/ui";

/**
 * Editor de uma tabela livre de especificações. Não assume domínio: o título,
 * os nomes das colunas e o conteúdo são todos do lojista. A primeira coluna
 * funciona como rótulo da linha, mas é só uma convenção de leitura — nada no
 * código depende do que está escrito nela.
 */
export function FichaEditor({
  valor,
  onChange,
  legendaVazio,
}: {
  valor: FichaTecnica | null;
  onChange: (valor: FichaTecnica | null) => void;
  legendaVazio: string;
}) {
  if (!valor) {
    return (
      <div className="rounded-xl border border-dashed border-line2 p-4 text-center">
        <p className="mb-3 text-sm text-muted">{legendaVazio}</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onChange({
              titulo: "Especificações",
              colunas: ["Item", "Valor"],
              linhas: [["", ""]],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Criar tabela
        </Button>
      </div>
    );
  }

  const ficha = valor;

  function atualizar(parcial: Partial<FichaTecnica>) {
    onChange({ ...ficha, ...parcial });
  }

  function adicionarColuna() {
    atualizar({
      colunas: [...ficha.colunas, ""],
      linhas: ficha.linhas.map((l) => [...l, ""]),
    });
  }

  function removerColuna(indice: number) {
    atualizar({
      colunas: ficha.colunas.filter((_, i) => i !== indice),
      linhas: ficha.linhas.map((l) => l.filter((_, i) => i !== indice)),
    });
  }

  function atualizarCelula(linha: number, coluna: number, texto: string) {
    atualizar({
      linhas: ficha.linhas.map((l, i) =>
        i === linha ? l.map((c, j) => (j === coluna ? texto : c)) : l,
      ),
    });
  }

  return (
    <div className="space-y-3">
      <div className="max-w-md">
        <Label htmlFor="ficha-titulo">Título exibido na vitrine</Label>
        <Input
          id="ficha-titulo"
          value={ficha.titulo}
          onChange={(e) => atualizar({ titulo: e.target.value })}
          placeholder="Especificações"
          className="mt-2 h-11"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface/60">
            <tr>
              {ficha.colunas.map((coluna, i) => (
                <th key={i} className="min-w-36 px-2 py-2">
                  <div className="flex items-center gap-1">
                    <Input
                      value={coluna}
                      onChange={(e) =>
                        atualizar({
                          colunas: ficha.colunas.map((c, j) => (j === i ? e.target.value : c)),
                        })
                      }
                      placeholder={i === 0 ? "Item" : "Valor"}
                      className="h-9 px-2 py-1 text-sm"
                    />
                    {ficha.colunas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerColuna(i)}
                        aria-label={`Remover coluna ${coluna || i + 1}`}
                        className="rounded p-1 text-muted2 transition hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10 px-2">
                <button
                  type="button"
                  onClick={adicionarColuna}
                  aria-label="Adicionar coluna"
                  className="rounded p-1 text-muted transition hover:text-ink"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ficha.linhas.map((linha, i) => (
              <tr key={i}>
                {ficha.colunas.map((_, c) => (
                  <td key={c} className="px-2 py-1.5">
                    <Input
                      value={linha[c] ?? ""}
                      onChange={(e) => atualizarCelula(i, c, e.target.value)}
                      placeholder="—"
                      className="h-9 px-2 py-1 text-sm"
                    />
                  </td>
                ))}
                <td className="px-2">
                  <button
                    type="button"
                    onClick={() => atualizar({ linhas: ficha.linhas.filter((_, x) => x !== i) })}
                    aria-label={`Remover linha ${i + 1}`}
                    className="rounded p-1 text-muted2 transition hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => atualizar({ linhas: [...ficha.linhas, ficha.colunas.map(() => "")] })}
        >
          <Plus className="h-4 w-4" />
          Adicionar linha
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
          Remover tabela
        </Button>
      </div>
    </div>
  );
}
