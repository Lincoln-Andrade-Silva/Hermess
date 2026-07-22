import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buscarProdutoPorSlug } from "@/features/vitrine/queries";
import { ProdutoDetalhe } from "@/features/vitrine/produto-detalhe";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const produto = await buscarProdutoPorSlug(params.slug);
  if (!produto) return { title: "Produto não encontrado" };

  return {
    title: produto.nome,
    description: produto.descricao ?? undefined,
    openGraph: produto.imagens[0] ? { images: [produto.imagens[0]] } : undefined,
  };
}

export default async function ProdutoPage({ params }: { params: { slug: string } }) {
  const produto = await buscarProdutoPorSlug(params.slug);
  if (!produto) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ProdutoDetalhe produto={produto} />
    </div>
  );
}
