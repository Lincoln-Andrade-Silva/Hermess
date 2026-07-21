import { requireAdmin } from "@/lib/auth";
import { getLojaBrand } from "@/lib/loja";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const { nome: nomeLoja, logoUrl } = await getLojaBrand();

  return (
    <AdminShell nome={profile.nome} nomeLoja={nomeLoja} logoUrl={logoUrl}>
      {children}
    </AdminShell>
  );
}
