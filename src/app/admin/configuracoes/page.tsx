import { obterConfiguracoes } from "@/features/configuracoes/actions";
import { ConfiguracoesClient } from "@/features/configuracoes/configuracoes-client";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const info = await obterConfiguracoes();
  return <ConfiguracoesClient info={info} />;
}
