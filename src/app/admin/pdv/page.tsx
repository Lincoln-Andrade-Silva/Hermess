import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { PdvClient } from "@/features/pdv/pdv-client";

export const dynamic = "force-dynamic";

export default async function PdvPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="PDV" description="Venda de balcão — baixa o estoque na hora." />
      <PdvClient />
    </>
  );
}
