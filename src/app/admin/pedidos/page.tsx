import { PageHeader } from "@/components/ui";
import { listarPedidosAdmin } from "@/features/pedidos/admin-actions";
import { PedidosAdminClient } from "@/features/pedidos/pedidos-admin-client";

export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const lista = await listarPedidosAdmin(searchParams);

  return (
    <>
      <PageHeader title="Pedidos" description="Acompanhe e gerencie os pedidos da loja." />
      <PedidosAdminClient lista={lista} />
    </>
  );
}
