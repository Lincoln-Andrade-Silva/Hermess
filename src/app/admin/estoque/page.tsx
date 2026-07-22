import type { ReactNode } from "react";
import { PageHeader, UrlTabBar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { listarCategorias } from "@/features/categorias/actions";
import { listarEstoque, listarMovimentacoes } from "@/features/estoque/actions";
import { EstoqueListaClient } from "@/features/estoque/estoque-lista-client";
import { MovimentacoesClient } from "@/features/estoque/movimentacoes-client";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "estoque", label: "Estoque" },
  { key: "movimentacoes", label: "Movimentações" },
] as const;

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: {
    tab?: string;
    q?: string;
    baixo?: string;
    categoria?: string;
    tipo?: string;
    page?: string;
  };
}) {
  await requireAdmin();
  const tab = searchParams.tab ?? "estoque";

  let conteudo: ReactNode;
  if (tab === "movimentacoes") {
    conteudo = <MovimentacoesClient lista={await listarMovimentacoes(searchParams)} />;
  } else {
    const [lista, categorias] = await Promise.all([
      listarEstoque(searchParams),
      listarCategorias(),
    ]);
    conteudo = (
      <EstoqueListaClient
        lista={lista}
        categorias={categorias
          .filter((c) => c.ativo)
          .map((c) => ({ value: c.slug, label: c.nome }))}
      />
    );
  }

  return (
    <>
      <PageHeader title="Estoque" description="Saldo por variação, entradas, ajustes e histórico." />
      <UrlTabBar tabs={TABS} defaultTab="estoque" resetParams={["baixo", "categoria", "tipo"]} />
      {conteudo}
    </>
  );
}
