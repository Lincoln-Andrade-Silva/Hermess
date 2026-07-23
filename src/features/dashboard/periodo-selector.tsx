"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { montarUrl } from "@/lib/pagination";
import { PRESETS } from "@/lib/periodo";

const ehData = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export function PeriodoSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const de = searchParams.get("de") ?? "";
  const ate = searchParams.get("ate") ?? "";
  const periodo = searchParams.get("periodo") ?? "30";
  const personalizado = ehData(de) && ehData(ate);

  function preset(valor: string) {
    router.replace(
      montarUrl(pathname, searchParams, {
        periodo: valor === "30" ? null : valor,
        de: null,
        ate: null,
        page: null,
      }),
    );
  }

  function setData(param: "de" | "ate", valor: string) {
    router.replace(
      montarUrl(pathname, searchParams, { [param]: valor || null, periodo: null, page: null }),
    );
  }

  function limpar() {
    router.replace(montarUrl(pathname, searchParams, { de: null, ate: null, periodo: null, page: null }));
  }

  const pill = (ativo: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition",
      ativo ? "border-ink bg-ink text-bg" : "border-line text-muted hover:border-ink hover:text-ink",
    );

  const dataInput = cn(
    "h-9 rounded-lg border bg-surface px-2.5 text-sm text-ink outline-none transition [color-scheme:light] focus:border-brand",
    personalizado ? "border-ink" : "border-line",
  );

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Período específico - esquerda */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={de}
          max={ate || undefined}
          onChange={(e) => setData("de", e.target.value)}
          aria-label="Data inicial"
          className={dataInput}
        />
        <span className="text-sm text-muted2">até</span>
        <input
          type="date"
          value={ate}
          min={de || undefined}
          onChange={(e) => setData("ate", e.target.value)}
          aria-label="Data final"
          className={dataInput}
        />
        {personalizado && (
          <button
            type="button"
            onClick={limpar}
            aria-label="Limpar período"
            className="text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            limpar
          </button>
        )}
      </div>

      {/* Presets - direita */}
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.valor}
            type="button"
            onClick={() => preset(p.valor)}
            className={pill(!personalizado && periodo === p.valor)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
