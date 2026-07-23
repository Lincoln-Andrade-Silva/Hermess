import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { listarUsuarios } from "@/features/usuarios/actions";
import { UsuariosClient } from "@/features/usuarios/usuarios-client";

export const dynamic = "force-dynamic";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: { q?: string; tipo?: string; status?: string; page?: string };
}) {
  await requireAdmin();
  const lista = await listarUsuarios(searchParams);

  return (
    <>
      <PageHeader title="Usuários" description="Clientes e administradores da loja." />
      <UsuariosClient lista={lista} />
    </>
  );
}
