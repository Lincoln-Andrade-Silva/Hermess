"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Menu, ShoppingBag, User, X } from "lucide-react";
import type { Profile } from "@/db/schema";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/features/auth/logout-button";

interface Props {
  nomeLoja: string;
  logoUrl: string | null;
  categorias: { nome: string; slug: string }[];
  profile: Pick<Profile, "nome" | "tipo"> | null;
  children: React.ReactNode;
}

export function LojaShell({ nomeLoja, logoUrl, categorias, profile, children }: Props) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        {/* Linha principal: menu/marca/ações. A marca fica centralizada como
            em loja de moda, não espremida no canto. */}
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="-ml-2 rounded-lg p-2 text-ink transition hover:bg-surface lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {profile?.tipo === "admin" && (
              <Link
                href="/admin"
                title="Painel administrativo"
                className="hidden items-center justify-center gap-2 rounded-lg border border-line bg-transparent px-3 py-2 text-xs font-medium text-muted transition hover:border-ink hover:text-ink lg:inline-flex"
              >
                <LayoutGrid className="h-4 w-4" />
                Painel
              </Link>
            )}
          </div>

          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={`${nomeLoja} — início`}
          >
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            )}
            <span className="font-display text-2xl font-extrabold uppercase tracking-[0.12em] text-ink">
              {nomeLoja}
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1">
            {profile?.tipo === "admin" && (
              <Link
                href="/admin"
                aria-label="Painel administrativo"
                className="rounded-lg p-2.5 text-ink transition hover:bg-surface lg:hidden"
              >
                <LayoutGrid className="h-5 w-5" />
              </Link>
            )}

            {profile ? (
              <>
                <Link
                  href="/minha-conta"
                  aria-label="Minha conta"
                  className="rounded-lg p-2.5 text-ink transition hover:bg-surface"
                >
                  <User className="h-5 w-5" />
                </Link>
                <div className="hidden sm:block">
                  <LogoutButton fullWidth={false} />
                </div>
              </>
            ) : (
              <Link
                href="/login"
                aria-label="Entrar"
                className="rounded-lg p-2.5 text-ink transition hover:bg-surface"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <Link
              href="/sacola"
              aria-label="Sacola"
              className="rounded-lg p-2.5 text-ink transition hover:bg-surface"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Categorias numa faixa própria, centralizada — desktop só. */}
        {categorias.length > 0 && (
          <nav className="hidden justify-center gap-1 border-t border-line px-4 lg:flex">
            <Link
              href="/produtos"
              className={cn(
                "border-b-2 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide transition",
                pathname === "/produtos"
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              Tudo
            </Link>
            {categorias.map((categoria) => {
              const href = `/categoria/${categoria.slug}`;
              return (
                <Link
                  key={categoria.slug}
                  href={href}
                  className={cn(
                    "border-b-2 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide transition",
                    pathname === href
                      ? "border-ink text-ink"
                      : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {categoria.nome}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuAberto(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="font-display text-xl font-extrabold uppercase tracking-wide">
                {nomeLoja}
              </span>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="rounded-lg p-2 text-muted transition hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-3">
              <Link
                href="/produtos"
                onClick={() => setMenuAberto(false)}
                className="rounded-lg px-3 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-surface"
              >
                Ver tudo
              </Link>
              {categorias.map((categoria) => (
                <Link
                  key={categoria.slug}
                  href={`/categoria/${categoria.slug}`}
                  onClick={() => setMenuAberto(false)}
                  className="rounded-lg px-3 py-3 font-display text-sm font-bold uppercase tracking-wide text-muted transition hover:bg-surface hover:text-ink"
                >
                  {categoria.nome}
                </Link>
              ))}
            </nav>
            {profile?.tipo === "admin" && (
              <div className="mt-auto border-t border-line p-3">
                <Link
                  href="/admin"
                  onClick={() => setMenuAberto(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
                >
                  Painel admin
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink">
            {nomeLoja}
          </p>
          <div className="mt-6 flex flex-col gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>Pagamento por Pix, crédito ou débito · Retirada no local</p>
            <p>© {new Date().getFullYear()} {nomeLoja}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
