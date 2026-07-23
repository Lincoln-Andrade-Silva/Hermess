import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { listarCategorias } from "@/features/categorias/actions";
import { PdvClient } from "@/features/pdv/pdv-client";

export const dynamic = "force-dynamic";

export default async function PdvPage() {
  await requireAdmin();
  const categorias = await listarCategorias();

  return (
    <>
      <PageHeader title="PDV" description="Venda de balcão — baixa o estoque na hora." />
      <PdvClient
        categorias={categorias.filter((c) => c.ativo).map((c) => ({ value: c.slug, label: c.nome }))}
      />
    </>
  );
}
