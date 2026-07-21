"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { enviarImagem } from "./actions";

/**
 * Galeria com upload múltiplo e reordenação. A primeira imagem é a capa —
 * a que aparece no card da vitrine —, por isso a ordem é explícita e não
 * depende da ordem de upload.
 */
export function GaleriaEditor({
  imagens,
  onChange,
  onErro,
}: {
  imagens: string[];
  onChange: (imagens: string[]) => void;
  onErro: (erro: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const [progresso, setProgresso] = useState<string | null>(null);

  function selecionar(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files ?? []);
    if (arquivos.length === 0) return;

    if (imagens.length + arquivos.length > 12) {
      onErro("Máximo de 12 imagens por produto.");
      event.target.value = "";
      return;
    }

    iniciarEnvio(async () => {
      const urls: string[] = [];
      for (const [indice, arquivo] of arquivos.entries()) {
        setProgresso(`Enviando ${indice + 1} de ${arquivos.length}...`);
        const formData = new FormData();
        formData.append("file", arquivo);
        const resultado = await enviarImagem(formData);
        if (resultado.erro) {
          onErro(`${arquivo.name}: ${resultado.erro}`);
          break;
        }
        if (resultado.url) urls.push(resultado.url);
      }
      setProgresso(null);
      if (urls.length > 0) onChange([...imagens, ...urls]);
    });

    event.target.value = "";
  }

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= imagens.length) return;
    const proximas = [...imagens];
    [proximas[indice], proximas[destino]] = [proximas[destino], proximas[indice]];
    onChange(proximas);
  }

  return (
    <div className="space-y-3">
      {imagens.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imagens.map((url, i) => (
            <div
              key={url}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-surface",
                i === 0 ? "border-ink" : "border-line",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />

              {i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bg">
                  Capa
                </span>
              )}

              {/* Sempre visível no toque: hover não existe no celular. */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/55 p-1.5 transition sm:opacity-0 sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover para trás"
                    className="rounded p-2 text-white transition hover:bg-white/20 disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === imagens.length - 1}
                    aria-label="Mover para frente"
                    className="rounded p-2 text-white transition hover:bg-white/20 disabled:opacity-40"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(imagens.filter((_, x) => x !== i))}
                  aria-label="Remover imagem"
                  className="rounded p-2 text-white transition hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple
        onChange={selecionar}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={enviando}>
          <ImagePlus className="h-4 w-4" />
          {imagens.length === 0 ? "Adicionar imagens" : "Adicionar mais"}
        </Button>
        {progresso && <span className="text-sm text-muted">{progresso}</span>}
        {!progresso && imagens.length === 0 && (
          <span className="text-xs text-muted">PNG, JPEG, WebP ou AVIF · até 5MB · proporção 3:4</span>
        )}
      </div>
    </div>
  );
}
