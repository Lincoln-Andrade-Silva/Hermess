"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Menu, ShoppingBag, User, X } from "lucide-react";
import type { Profile } from "@/db/schema";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/features/auth/logout-button";

/** Glifo do Instagram — o lucide removeu ícones de marca por trademark. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface Props {
  nomeLoja: string;
  logoUrl: string | null;
  endereco?: string | null;
  instagram?: string | null;
  categorias: { nome: string; slug: string }[];
  profile: Pick<Profile, "nome" | "tipo"> | null;
  children: React.ReactNode;
}

export function LojaShell({
  nomeLoja,
  logoUrl,
  endereco,
  instagram,
  categorias,
  profile,
  children,
}: Props) {
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
            className="flex shrink-0 items-center gap-2 px-2"
            aria-label={`${nomeLoja} — início`}
          >
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            )}
            <span className="whitespace-nowrap font-display text-base font-extrabold uppercase tracking-[0.06em] text-ink sm:text-lg">
              {nomeLoja}
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1">
            {/* Conta some do header no mobile — vai para o menu lateral. */}
            <div className="hidden items-center gap-1 sm:flex">
              {profile ? (
                <>
                  <Link
                    href="/minha-conta"
                    aria-label="Minha conta"
                    className="rounded-lg p-2.5 text-ink transition hover:bg-surface"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                  <LogoutButton fullWidth={false} />
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
            </div>

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
        <div className="fixed inset-x-0 top-0 z-50 h-[100dvh] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuAberto(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="flex min-w-0 items-center gap-2">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                )}
                <span className="truncate font-display text-lg font-extrabold uppercase tracking-wide">
                  {nomeLoja}
                </span>
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
            <nav className="flex flex-1 flex-col overflow-y-auto p-3">
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
            <div className="mt-auto border-t border-line p-3 pb-[calc(env(safe-area-inset-bottom)_+_1.25rem)]">
              {profile ? (
                <>
                  <Link
                    href="/minha-conta"
                    onClick={() => setMenuAberto(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-ink transition hover:bg-surface"
                  >
                    <User className="h-4 w-4" />
                    Minha conta
                  </Link>
                  {profile.tipo === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuAberto(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Painel admin
                    </Link>
                  )}
                  <div className="px-3 pt-2">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-ink transition hover:bg-surface"
                >
                  <User className="h-4 w-4" />
                  Entrar / criar conta
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            )}
            <p className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink">
              {nomeLoja}
            </p>
          </div>
          {(endereco || instagram) && (
            <div className="mt-4 flex flex-col gap-2 text-xs text-muted">
              {endereco && <p>Retirada: {endereco}</p>}
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-3 py-1.5 font-medium transition hover:border-ink hover:text-ink"
                >
                  <InstagramIcon className="h-4 w-4" />
                  {instagram.replace(/^@/, "")}
                </a>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>Pagamento por Pix, crédito ou débito · Retirada no local</p>
            <p>© {new Date().getFullYear()} {nomeLoja}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
