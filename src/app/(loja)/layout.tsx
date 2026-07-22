import { getProfileOpcional } from "@/lib/auth";
import { getLojaInfo, NOME_PADRAO } from "@/lib/loja";
import { listarCategoriasComProduto } from "@/features/vitrine/queries";
import { LojaShell } from "@/components/loja/loja-shell";
import { SacolaProvider } from "@/features/sacola/sacola-context";

export const dynamic = "force-dynamic";

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const [profile, info, categorias] = await Promise.all([
    getProfileOpcional(),
    getLojaInfo(),
    listarCategoriasComProduto(),
  ]);

  return (
    <SacolaProvider>
      <LojaShell
        nomeLoja={info?.nome.trim() || NOME_PADRAO}
        logoUrl={info?.logoUrl ?? null}
        endereco={info?.endereco ?? null}
        instagram={info?.instagram ?? null}
        telefone={info?.telefone ?? null}
        categorias={categorias}
        profile={profile ? { nome: profile.nome, tipo: profile.tipo } : null}
      >
        {children}
      </LojaShell>
    </SacolaProvider>
  );
}
