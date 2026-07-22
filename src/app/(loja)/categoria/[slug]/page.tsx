import { Suspense } from "react";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { listarFiltrosDisponiveis, listarVitrine } from "@/features/vitrine/queries";
import { Listagem } from "@/features/vitrine/listagem";

export const dynamic = "force-dynamic";

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string; v?: string | string[]; ordem?: string };
}) {
  const [categoria] = await db
    .select({ nome: categorias.nome, ativo: categorias.ativo })
    .from(categorias)
    .where(eq(categorias.slug, params.slug));

  if (!categoria || !categoria.ativo) notFound();

  const valores = Array.isArray(searchParams.v)
    ? searchParams.v
    : searchParams.v
      ? [searchParams.v]
      : [];

  const [lista, grupos] = await Promise.all([
    listarVitrine({
      categoria: params.slug,
      page: Number(searchParams.page) || 1,
      valores,
      ordem: searchParams.ordem as never,
    }),
    listarFiltrosDisponiveis(params.slug),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-wide text-ink sm:text-4xl">
        {categoria.nome}
      </h1>
      <Suspense fallback={null}>
        <Listagem
          itens={lista.itens}
          page={lista.page}
          pageCount={lista.pageCount}
          grupos={grupos}
          vazio="Nenhum produto nesta categoria por enquanto."
        />
      </Suspense>
    </div>
  );
}
