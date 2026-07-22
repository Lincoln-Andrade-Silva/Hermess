import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getTaxaGateway } from "@/lib/pagamento";
import { buscarProduto, listarCategoriasAtivas } from "@/features/produtos/actions";
import { ProdutoForm } from "@/features/produtos/produto-form";

export const dynamic = "force-dynamic";

export default async function ProdutoPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const criando = params.id === "novo";
  const produto = criando ? null : await buscarProduto(params.id);
  if (!criando && !produto) notFound();

  const [categorias, taxaGateway] = await Promise.all([
    listarCategoriasAtivas(),
    getTaxaGateway(),
  ]);

  return <ProdutoForm produto={produto} categorias={categorias} taxaGateway={taxaGateway} />;
}
