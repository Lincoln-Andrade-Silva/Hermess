import { Suspense } from "react";
import { listarFiltrosDisponiveis, listarVitrine } from "@/features/vitrine/queries";
import { Listagem } from "@/features/vitrine/listagem";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { page?: string; v?: string | string[]; ordem?: string };
}) {
  const valores = Array.isArray(searchParams.v)
    ? searchParams.v
    : searchParams.v
      ? [searchParams.v]
      : [];

  const [lista, grupos] = await Promise.all([
    listarVitrine({
      page: Number(searchParams.page) || 1,
      valores,
      ordem: searchParams.ordem as never,
    }),
    listarFiltrosDisponiveis(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-wide text-ink sm:text-4xl">
        Todos os produtos
      </h1>
      <Suspense fallback={null}>
        <Listagem
          itens={lista.itens}
          page={lista.page}
          pageCount={lista.pageCount}
          grupos={grupos}
        />
      </Suspense>
    </div>
  );
}
