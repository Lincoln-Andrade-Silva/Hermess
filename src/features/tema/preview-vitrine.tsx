"use client";

import { Heart, Search, ShoppingBag } from "lucide-react";

/**
 * Miniatura da vitrine com o tema em edição aplicado. Recebe as CSS vars já
 * resolvidas e as sobrescreve só no seu container: os utilitários semânticos lá
 * dentro (`bg-bg`, `text-ink`, `bg-brand`...) passam a resolver contra elas, sem
 * afetar o painel em volta. É o preview do escopo vitrine, que o admin não vê ao
 * vivo por estar dentro do painel.
 */
export function PreviewVitrine({
  vars,
  fonteCorpoVar,
  fonteTituloVar,
  nomeLoja,
}: {
  vars: Record<string, string>;
  fonteCorpoVar: string;
  fonteTituloVar: string;
  nomeLoja: string;
}) {
  const estilo = {
    ...vars,
    "--font-sans": `var(${fonteCorpoVar})`,
    "--font-display": `var(${fonteTituloVar})`,
    fontFamily: "var(--font-sans)",
  } as React.CSSProperties;

  const produtos = [
    { nome: "Camiseta Oversized", preco: "R$ 129,90" },
    { nome: "Calça Cargo", preco: "R$ 259,90" },
  ];

  return (
    <div style={estilo} className="overflow-hidden rounded-2xl border border-line bg-bg text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-display text-lg font-extrabold uppercase tracking-wide text-ink">
          {nomeLoja}
        </span>
        <div className="flex items-center gap-3 text-muted">
          <Search className="h-4 w-4" />
          <Heart className="h-4 w-4" />
          <ShoppingBag className="h-4 w-4" />
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
        <div>
          <p className="font-display text-base font-bold uppercase leading-none text-ink">
            Nova coleção
          </p>
          <p className="mt-1 text-xs text-muted">Peças que acabaram de chegar.</p>
        </div>
        <span className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-brand-fg">
          Ver tudo
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {produtos.map((produto) => (
          <div key={produto.nome} className="overflow-hidden rounded-xl border border-line">
            <div className="aspect-[4/5] w-full bg-surface2" />
            <div className="space-y-2 p-3">
              <p className="truncate font-display text-sm font-bold uppercase leading-tight text-ink">
                {produto.nome}
              </p>
              <p className="text-sm font-semibold text-ink">{produto.preco}</p>
              <button
                type="button"
                disabled
                className="w-full rounded-lg bg-brand py-2 text-xs font-bold text-brand-fg"
              >
                Adicionar à sacola
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
