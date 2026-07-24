"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "./modal";
import { Label } from "./field";
import { SpectrumPicker } from "./spectrum-picker";

/**
 * Paleta de partida. Cobre o que aparece na maioria dos catálogos sem obrigar
 * o lojista a saber hexadecimal - que é o problema do input nativo do sistema,
 * ainda mais no celular, onde ele abre um seletor cru do Android/iOS.
 */
const PALETA: { nome: string; hex: string }[] = [
  { nome: "Preto", hex: "#111111" },
  { nome: "Grafite", hex: "#3f3f46" },
  { nome: "Cinza", hex: "#9ca3af" },
  { nome: "Off White", hex: "#f2efe9" },
  { nome: "Branco", hex: "#ffffff" },
  { nome: "Bege", hex: "#d9c6a5" },
  { nome: "Marrom", hex: "#6b4b36" },
  { nome: "Vinho", hex: "#7a1f2b" },
  { nome: "Vermelho", hex: "#d92d20" },
  { nome: "Laranja", hex: "#ea6a1e" },
  { nome: "Amarelo", hex: "#f5c518" },
  { nome: "Verde", hex: "#2f7a4d" },
  { nome: "Militar", hex: "#4b5320" },
  { nome: "Azul", hex: "#2563eb" },
  { nome: "Marinho", hex: "#1e3a5f" },
  { nome: "Roxo", hex: "#6d3d9e" },
  { nome: "Rosa", hex: "#e8709a" },
  { nome: "Caramelo", hex: "#a9682f" },
];

export function ColorPicker({
  value,
  onChange,
  rotulo,
}: {
  value: string;
  onChange: (hex: string) => void;
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);

  function escolher(hex: string) {
    onChange(hex);
    setAberto(false);
  }

  const nomeAtual = PALETA.find((c) => c.hex.toLowerCase() === value.toLowerCase())?.nome;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={rotulo ? `Escolher cor de ${rotulo}` : "Escolher cor"}
        className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-lg border border-line bg-surface transition hover:border-line2"
      >
        <span
          aria-hidden
          style={{ backgroundColor: value }}
          className="h-7 w-7 rounded-full border border-line2"
        />
      </button>

      <Modal open={aberto} onClose={() => setAberto(false)} title="Escolher cor" className="max-w-md">
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {PALETA.map((cor) => {
              const ativa = cor.hex.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={cor.hex}
                  type="button"
                  onClick={() => escolher(cor.hex)}
                  title={cor.nome}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-2 transition",
                    ativa ? "border-ink bg-surface" : "border-transparent hover:bg-surface",
                  )}
                >
                  <span
                    style={{ backgroundColor: cor.hex }}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line2"
                  >
                    {ativa && (
                      <Check
                        className="h-5 w-5"
                        strokeWidth={3}
                        // Marca escura sobre cor clara, clara sobre escura.
                        style={{ color: corClara(cor.hex) ? "#111111" : "#ffffff" }}
                      />
                    )}
                  </span>
                  <span className="text-center text-[11px] leading-tight text-muted">
                    {cor.nome}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <Label>Outra cor</Label>
            <SpectrumPicker value={value} onChange={onChange} />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-muted">
                <span
                  aria-hidden
                  style={{ backgroundColor: value }}
                  className="h-5 w-5 rounded-full border border-line2"
                />
                <span className="font-mono">{value.toUpperCase()}</span>
                {nomeAtual && <strong className="text-ink">{nomeAtual}</strong>}
              </span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-brand-fg transition hover:bg-brand-dark"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Luminância aproximada, para decidir a cor do check sobre o swatch. */
function corClara(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
