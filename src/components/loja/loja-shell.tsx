"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User, X } from "lucide-react";
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="-ml-2 rounded-lg p-2 text-ink transition hover:bg-surface lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            )}
            <span className="font-display text-2xl font-extrabold uppercase tracking-wide text-ink">
              {nomeLoja}
            </span>
          </Link>

          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {categorias.map((categoria) => (
              <Link
                key={categoria.slug}
                href={`/categoria/${categoria.slug}`}
                className="rounded-lg px-3 py-2 font-display text-sm font-bold uppercase tracking-wide text-muted transition hover:text-ink"
              >
                {categoria.nome}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {profile ? (
              <>
                {profile.tipo === "admin" && (
                  <Link
                    href="/admin"
                    className="hidden rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted transition hover:bg-surface hover:text-ink sm:block"
                  >
                    Painel
                  </Link>
                )}
                <span className="hidden text-sm text-muted sm:block">
                  {profile.nome.split(" ")[0]}
                </span>
                <LogoutButton fullWidth={false} />
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>
        </div>
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
          </aside>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className={cn("font-display text-lg font-extrabold uppercase tracking-wide text-ink")}>
            {nomeLoja}
          </p>
          <p className="text-xs">Pagamento por Pix, crédito ou débito · Retirada no local</p>
        </div>
      </footer>
    </div>
  );
}
