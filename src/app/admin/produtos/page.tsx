import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { listarCategoriasAtivas, listarProdutos } from "@/features/produtos/actions";
import { ProdutosClient } from "@/features/produtos/produtos-client";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; categoria?: string };
}) {
  const [lista, categorias] = await Promise.all([
    listarProdutos(searchParams),
    listarCategoriasAtivas(),
  ]);

  return (
    <>
      <PageHeader title="Produtos" description="Catálogo da loja, com variações e estoque." />
      <Suspense fallback={null}>
        <ProdutosClient
          itens={lista.itens}
          page={lista.page}
          pageCount={lista.pageCount}
          categorias={categorias}
        />
      </Suspense>
    </>
  );
}
