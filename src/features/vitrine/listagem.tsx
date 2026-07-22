"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { montarUrl } from "@/lib/pagination";
import { ProdutoCard } from "./produto-card";
import { FiltrosDrawer, FiltrosSidebar, OrdenarSelect, type GrupoFiltro } from "./filtros";
import type { ProdutoVitrine } from "./queries";

/**
 * Grade de produtos com filtros e paginação. Paginação por URL, como o resto
 * da vitrine, para o botão voltar do navegador funcionar e o link ser
 * compartilhável já na página certa.
 */
export function Listagem({
  itens,
  page,
  pageCount,
  grupos,
  vazio = "Nenhum produto encontrado.",
}: {
  itens: ProdutoVitrine[];
  page: number;
  pageCount: number;
  grupos: GrupoFiltro[];
  vazio?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function irPara(p: number) {
    router.replace(montarUrl(pathname, searchParams, { page: p > 1 ? String(p) : null }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Barra mobile: filtros + ordenação inline. */}
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        {grupos.length > 0 && <FiltrosDrawer grupos={grupos} />}
        <OrdenarSelect className="ml-auto" />
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          {grupos.length > 0 && <FiltrosSidebar grupos={grupos} />}
        </aside>

        <div>
          {/* Desktop: ordenação acima da grade, à direita. */}
          <div className="mb-6 hidden justify-end lg:flex">
            <OrdenarSelect />
          </div>

          {itens.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line2 px-6 py-16 text-center text-sm text-muted">
            {vazio}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
            {itens.map((produto, i) => (
              <ProdutoCard key={produto.id} produto={produto} prioridade={i < 3} />
            ))}
          </div>
        )}

          {pageCount > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => irPara(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="text-sm text-muted">
                {page} de {pageCount}
              </span>
              <button
                type="button"
                onClick={() => irPara(page + 1)}
                disabled={page >= pageCount}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
