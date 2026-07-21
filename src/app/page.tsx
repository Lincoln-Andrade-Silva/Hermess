import Link from "next/link";
import { Card } from "@/components/ui";
import { getProfileOpcional } from "@/lib/auth";
import { getLojaBrand } from "@/lib/loja";
import { LogoutButton } from "@/features/auth/logout-button";

export const dynamic = "force-dynamic";

/** Placeholder da vitrine: a listagem de produtos entra na Fase 3. */
export default async function HomePage() {
  const [profile, { nome: nomeLoja }] = await Promise.all([getProfileOpcional(), getLojaBrand()]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
            {nomeLoja}
          </Link>

          {profile ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted sm:inline">{profile.nome}</span>
              {profile.tipo === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted transition hover:bg-surface hover:text-ink"
                >
                  Painel
                </Link>
              )}
              <LogoutButton fullWidth={false} />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-brand transition hover:bg-brand-dark"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Card className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Vitrine em construção</h1>
          <p className="mt-2 text-sm text-muted">
            O catálogo de produtos entra na Fase 3. A autenticação já está funcionando.
          </p>
        </Card>
      </main>
    </div>
  );
}
