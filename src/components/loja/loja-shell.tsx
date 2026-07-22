"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Menu, ShoppingBag, User, X } from "lucide-react";
import type { Profile } from "@/db/schema";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/features/auth/logout-button";
import { useSacola } from "@/features/sacola/sacola-context";

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

/** Glifo do WhatsApp — também removido do lucide por trademark. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/** Monta o link do WhatsApp a partir do telefone (adiciona DDI 55 quando ausente). */
function linkWhatsApp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  const comDdi = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comDdi}`;
}

interface Props {
  nomeLoja: string;
  logoUrl: string | null;
  endereco?: string | null;
  instagram?: string | null;
  telefone?: string | null;
  categorias: { nome: string; slug: string }[];
  profile: Pick<Profile, "nome" | "tipo"> | null;
  children: React.ReactNode;
}

/** Ícone da sacola com contador; só mostra o badge após hidratar o carrinho. */
function SacolaLink() {
  const { quantidadeTotal, pronto } = useSacola();
  return (
    <Link
      href="/sacola"
      aria-label={`Sacola${pronto && quantidadeTotal > 0 ? ` (${quantidadeTotal})` : ""}`}
      className="relative rounded-lg p-2.5 text-ink transition hover:bg-surface"
    >
      <ShoppingBag className="h-5 w-5" />
      {pronto && quantidadeTotal > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold leading-none text-bg">
          {quantidadeTotal > 99 ? "99+" : quantidadeTotal}
        </span>
      )}
    </Link>
  );
}

export function LojaShell({
  nomeLoja,
  logoUrl,
  endereco,
  instagram,
  telefone,
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

            <SacolaLink />
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
          {(endereco || instagram || telefone) && (
            <div className="mt-4 flex flex-col gap-3 text-xs text-muted">
              {endereco && <p>Retirada: {endereco}</p>}
              {(instagram || telefone) && (
                <div className="flex flex-wrap items-center gap-2">
                  {instagram && (
                    <a
                      href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-medium text-ink transition hover:border-ink"
                    >
                      <InstagramIcon className="h-4 w-4" />
                      {instagram.replace(/^@/, "")}
                    </a>
                  )}
                  {telefone && (
                    <a
                      href={linkWhatsApp(telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-medium text-ink transition hover:border-emerald-600 hover:text-emerald-600"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Fale conosco
                    </a>
                  )}
                </div>
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
