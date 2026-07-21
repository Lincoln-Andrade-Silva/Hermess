"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Store, X } from "lucide-react";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { LogoutButton } from "@/features/auth/logout-button";
import { cn } from "@/lib/cn";

function Brand({ nomeLoja, logoUrl }: { nomeLoja: string; logoUrl: string | null }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-5 pb-[18px] pt-6">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={nomeLoja}
          className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="truncate text-lg font-extrabold tracking-tight text-ink">{nomeLoja}</p>
        <p className="text-xs text-muted">Painel Admin</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 px-3 py-4">
      {ADMIN_NAV.map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted2">
            {section.label}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

            if (!item.ready) {
              return (
                <div
                  key={item.label}
                  title="Em breve"
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] text-muted2"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-muted2">
                    em breve
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] transition",
                  active
                    ? "bg-surface2 font-semibold text-ink"
                    : "font-medium text-muted hover:bg-surface hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function UserFooter({ nome }: { nome: string }) {
  return (
    <div className="mt-auto border-t border-line p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          {nome.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{nome}</p>
          <p className="text-xs font-medium text-muted">Administrador</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted transition hover:bg-surface hover:text-ink"
        >
          <Store className="h-4 w-4" />
          Ver a loja
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}

export function AdminShell({
  nome,
  nomeLoja,
  logoUrl,
  children,
}: {
  nome: string;
  nomeLoja: string;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-panel lg:flex">
        <Brand nomeLoja={nomeLoja} logoUrl={logoUrl} />
        <NavList />
        <UserFooter nome={nome} />
      </aside>

      {/* Topbar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel/80 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-lg p-2 text-ink transition hover:bg-surface"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={nomeLoja}
              className="h-7 w-7 rounded-full border border-line object-cover"
            />
          )}
          <span className="text-sm font-semibold text-ink">{nomeLoja}</span>
        </div>
      </header>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pr-2">
              <Brand nomeLoja={nomeLoja} logoUrl={logoUrl} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <UserFooter nome={nome} />
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
