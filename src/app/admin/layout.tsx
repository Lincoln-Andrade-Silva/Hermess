import { requireAdmin } from "@/lib/auth";
import { getLojaBrand } from "@/lib/loja";
import { AdminShell } from "@/components/admin/admin-shell";
import { TemaEscopo, viewportDoEscopo } from "@/components/tema-escopo";

export const dynamic = "force-dynamic";

export const generateViewport = () => viewportDoEscopo("admin");

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const { nome: nomeLoja, logoUrl } = await getLojaBrand();

  return (
    <>
      <TemaEscopo escopo="admin" />
      <AdminShell nome={profile.nome} nomeLoja={nomeLoja} logoUrl={logoUrl}>
        {children}
      </AdminShell>
    </>
  );
}
