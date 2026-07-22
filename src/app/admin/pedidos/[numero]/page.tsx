import { notFound } from "next/navigation";
import { buscarPedidoAdmin } from "@/features/pedidos/admin-actions";
import { PedidoAdminDetalheView } from "@/features/pedidos/pedido-admin-detalhe";

export const dynamic = "force-dynamic";

export default async function PedidoAdminPage({ params }: { params: { numero: string } }) {
  const numero = Number(params.numero);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const pedido = await buscarPedidoAdmin(numero);
  if (!pedido) notFound();

  return <PedidoAdminDetalheView pedido={pedido} />;
}
