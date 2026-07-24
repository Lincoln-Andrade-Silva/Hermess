import type { ReactNode } from "react";
import { PageHeader, UrlTabBar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { obterConfiguracoes } from "@/features/configuracoes/actions";
import { ConfiguracoesClient } from "@/features/configuracoes/configuracoes-client";
import { obterPagamentoConfig } from "@/features/pagamento/actions";
import { PagamentoForm } from "@/features/pagamento/pagamento-form";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "estabelecimento", label: "Estabelecimento" },
  { key: "pagamentos", label: "Pagamentos" },
] as const;

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  await requireAdmin();

  // Cada aba tem o seu formulário e a sua action - só o cabeçalho é comum.
  let conteudo: ReactNode;
  if (searchParams.tab === "pagamentos") {
    conteudo = <PagamentoForm config={await obterPagamentoConfig()} />;
  } else {
    conteudo = <ConfiguracoesClient info={await obterConfiguracoes()} />;
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Identidade da loja e credenciais de cobrança."
      />
      <UrlTabBar tabs={TABS} defaultTab="estabelecimento" resetParams={[]} />
      {conteudo}
    </>
  );
}
