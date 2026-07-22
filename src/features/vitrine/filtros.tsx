"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ValorOpcao } from "@/db/schema";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { montarUrl } from "@/lib/pagination";

export interface GrupoFiltro {
  nome: string;
  tipo: "texto" | "cor";
  valores: ValorOpcao[];
}

const ORDENS = [
  { valor: "recentes", label: "Novidades" },
  { valor: "menor-preco", label: "Menor preço" },
  { valor: "maior-preco", label: "Maior preço" },
  { valor: "nome", label: "A–Z" },
];

/**
 * Dropdown de ordenação, autossuficiente (lê e escreve a ordem na URL). Fica
 * fora dos filtros para poder ser posicionado acima da grade no desktop.
 */
export function OrdenarSelect({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const ordemAtual = searchParams.get("ordem") ?? "recentes";
  const atual = ORDENS.find((o) => o.valor === ordemAtual) ?? ORDENS[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function trocar(valor: string) {
    router.replace(
      montarUrl(pathname, searchParams, {
        ordem: valor === "recentes" ? null : valor,
        page: null,
      }),
    );
    setAberto(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface"
      >
        <ArrowDownUp className="h-4 w-4 text-muted2" />
        <span className="whitespace-nowrap">{atual.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted2 transition", aberto && "rotate-180")} />
      </button>

      {aberto && (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-bg p-1 shadow-xl"
        >
          {ORDENS.map((ordem) => {
            const ativo = ordem.valor === ordemAtual;
            return (
              <button
                key={ordem.valor}
                type="button"
                role="option"
                aria-selected={ativo}
                onClick={() => trocar(ordem.valor)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                  ativo
                    ? "bg-surface2 font-semibold text-ink"
                    : "text-muted hover:bg-surface hover:text-ink",
                )}
              >
                {ordem.label}
                {ativo && <Check className="h-4 w-4 shrink-0 text-ink" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Conteúdo dos filtros (eixos). Estado na URL — link compartilhável. */
function PainelFiltros({ grupos }: { grupos: GrupoFiltro[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selecionados = searchParams.getAll("v");

  function alternar(par: string) {
    const params = new URLSearchParams(searchParams.toString());
    const atuais = params.getAll("v");
    params.delete("v");
    for (const valor of atuais) {
      if (valor !== par) params.append("v", valor);
    }
    if (!atuais.includes(par)) params.append("v", par);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function limpar() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("v");
    params.delete("page");
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <div key={grupo.nome} className="space-y-3">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">
            {grupo.nome}
          </p>
          <div className="flex flex-wrap gap-2">
            {grupo.valores.map((valor) => {
              const par = `${grupo.nome}:${valor.valor}`;
              const ativo = selecionados.includes(par);

              if (grupo.tipo === "cor") {
                return (
                  <button
                    key={valor.valor}
                    type="button"
                    onClick={() => alternar(par)}
                    aria-pressed={ativo}
                    title={valor.valor}
                    className={cn(
                      "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-medium transition",
                      ativo ? "border-ink bg-surface text-ink" : "border-line text-muted hover:border-line2",
                    )}
                  >
                    <span
                      style={{ backgroundColor: valor.hex }}
                      className="h-5 w-5 rounded-full border border-line2"
                    />
                    {valor.valor}
                  </button>
                );
              }

              return (
                <button
                  key={valor.valor}
                  type="button"
                  onClick={() => alternar(par)}
                  aria-pressed={ativo}
                  className={cn(
                    "min-w-11 rounded-lg border px-3 py-2 text-sm font-medium transition",
                    ativo ? "border-ink bg-ink text-bg" : "border-line text-muted hover:border-line2",
                  )}
                >
                  {valor.valor}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selecionados.length > 0 && (
        <Button variant="secondary" onClick={limpar} className="w-full">
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

/** Coluna de filtros — desktop. */
export function FiltrosSidebar({ grupos }: { grupos: GrupoFiltro[] }) {
  return <PainelFiltros grupos={grupos} />;
}

/** Botão + drawer de filtros — mobile. */
export function FiltrosDrawer({ grupos }: { grupos: GrupoFiltro[] }) {
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState(false);
  const selecionados = searchParams.getAll("v");

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {selecionados.length > 0 && (
          <span className="rounded-full bg-ink px-1.5 text-[11px] font-bold text-bg">
            {selecionados.length}
          </span>
        )}
      </button>

      {aberto && (
        <div className="fixed inset-x-0 top-0 z-50 h-[100dvh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAberto(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-bg p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-display text-xl font-extrabold uppercase tracking-wide">Filtros</p>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar filtros"
                className="rounded-lg p-2 text-muted transition hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PainelFiltros grupos={grupos} />
            <Button onClick={() => setAberto(false)} className="mt-5 w-full">
              Ver resultados
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
