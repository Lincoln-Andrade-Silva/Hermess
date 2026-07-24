"use client";

import { Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui";

/**
 * Miniatura do painel com o tema em edição aplicado. Sobrescreve as CSS vars só
 * no seu container, então mostra o resultado num recorte estável mesmo enquanto
 * o painel real muda ao vivo em volta. Traz os elementos que mais carregam a
 * identidade do admin: cabeçalho com ação, cartões de número e uma linha de
 * lista com badge de status - inclusive um estado de feedback tokenizado.
 */
export function PreviewPainel({
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

  const numeros = [
    { rotulo: "Vendas hoje", valor: "R$ 1.240" },
    { rotulo: "Pedidos", valor: "18" },
  ];

  return (
    <div style={estilo} className="overflow-hidden rounded-2xl border border-line bg-bg text-ink">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-brand-fg">
          {nomeLoja.charAt(0).toUpperCase()}
        </span>
        <span className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
          Painel
        </span>
        <button
          type="button"
          disabled
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-fg"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 p-4">
        {numeros.map((item) => (
          <div key={item.rotulo} className="rounded-xl border border-line bg-surface p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
              {item.rotulo}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 px-4 pb-4">
        {[
          { nome: "Pedido #1042", ok: true },
          { nome: "Pedido #1041", ok: false },
        ].map((linha) => (
          <div
            key={linha.nome}
            className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
          >
            <Package className="h-4 w-4 shrink-0 text-muted2" />
            <span className="text-sm font-medium text-ink">{linha.nome}</span>
            <span className="ml-auto">
              {linha.ok ? (
                <Badge tone="success">Pago</Badge>
              ) : (
                <Badge tone="warning">Aguardando</Badge>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
