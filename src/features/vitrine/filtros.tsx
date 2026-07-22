"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
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
 * Filtros da vitrine. Estado mora na URL, então filtro aplicado é link
 * compartilhável e o botão voltar do navegador funciona.
 */
export function Filtros({ grupos }: { grupos: GrupoFiltro[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState(false);

  const selecionados = searchParams.getAll("v");
  const ordemAtual = searchParams.get("ordem") ?? "recentes";

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

  function trocarOrdem(valor: string) {
    router.replace(
      montarUrl(pathname, searchParams, {
        ordem: valor === "recentes" ? null : valor,
        page: null,
      }),
    );
  }

  function limpar() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("v");
    params.delete("page");
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  const painel = (
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

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {selecionados.length > 0 && (
            <span className="rounded-full bg-ink px-1.5 text-[11px] font-bold text-bg">
              {selecionados.length}
            </span>
          )}
        </button>

        {/* Ordenação inline: rola na horizontal no mobile em vez de quebrar linha. */}
        <div className="flex flex-1 gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:ml-auto lg:flex-none [&::-webkit-scrollbar]:hidden">
          {ORDENS.map((ordem) => (
            <button
              key={ordem.valor}
              type="button"
              onClick={() => trocarOrdem(ordem.valor)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition",
                ordemAtual === ordem.valor ? "bg-surface2 text-ink" : "text-muted hover:text-ink",
              )}
            >
              {ordem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: coluna fixa. Mobile: painel deslizante. */}
      <div className="hidden lg:block">{painel}</div>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAberto(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg p-5">
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
            {painel}
            <Button onClick={() => setAberto(false)} className="mt-5 w-full">
              Ver resultados
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
