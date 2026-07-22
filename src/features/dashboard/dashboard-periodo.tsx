"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { montarUrl } from "@/lib/pagination";

const OPCOES = [
  { valor: "7", label: "7 dias" },
  { valor: "30", label: "30 dias" },
  { valor: "90", label: "90 dias" },
];

export function DashboardPeriodo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const atual = searchParams.get("periodo") ?? "30";

  function trocar(valor: string) {
    router.replace(montarUrl(pathname, searchParams, { periodo: valor === "30" ? null : valor }));
  }

  return (
    <div className="flex gap-1 rounded-xl bg-surface p-1">
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => trocar(o.valor)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
            atual === o.valor ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
