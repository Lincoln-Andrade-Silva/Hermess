import { getProfileOpcional } from "@/lib/auth";
import { getLojaBrand } from "@/lib/loja";
import { listarCategoriasComProduto } from "@/features/vitrine/queries";
import { LojaShell } from "@/components/loja/loja-shell";

export const dynamic = "force-dynamic";

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const [profile, marca, categorias] = await Promise.all([
    getProfileOpcional(),
    getLojaBrand(),
    listarCategoriasComProduto(),
  ]);

  return (
    <LojaShell
      nomeLoja={marca.nome}
      logoUrl={marca.logoUrl}
      categorias={categorias}
      profile={profile ? { nome: profile.nome, tipo: profile.tipo } : null}
    >
      {children}
    </LojaShell>
  );
}
