import { obterPagamentoConfig } from "@/features/pagamento/actions";
import { PagamentoForm } from "@/features/pagamento/pagamento-form";

export const dynamic = "force-dynamic";

export default async function PagamentoPage() {
  const config = await obterPagamentoConfig();
  return <PagamentoForm config={config} />;
}
