import { PageHeader, UrlTabBar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getLojaBrand } from "@/lib/loja";
import type { EscopoTema } from "@/lib/tema";
import { obterTemaConfig } from "@/features/tema/queries";
import { TemaForm } from "@/features/tema/tema-form";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "vitrine", label: "Vitrine" },
  { key: "painel", label: "Painel" },
] as const;

export default async function AparenciaPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  await requireAdmin();

  const escopo: EscopoTema = searchParams.tab === "painel" ? "admin" : "vitrine";
  const [config, { nome: nomeLoja }] = await Promise.all([
    obterTemaConfig(escopo),
    getLojaBrand(),
  ]);

  return (
    <>
      <PageHeader
        title="Aparência"
        description="Tema e tipografia do sistema. A vitrine e o painel são configurados separadamente."
      />
      <UrlTabBar tabs={TABS} defaultTab="vitrine" resetParams={[]} />
      {/* Trocar de aba troca o registro editado: a `key` reinicia o formulário. */}
      <TemaForm key={escopo} escopo={escopo} config={config} nomeLoja={nomeLoja} />
    </>
  );
}
