import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { formatBRL, formatData } from "@/lib/format";
import { Badge } from "@/components/ui";
import { LogoutButton } from "@/features/auth/logout-button";
import { listarMeusPedidos } from "@/features/pedidos/actions";
import { STATUS_LABEL, STATUS_TONE } from "@/features/pedidos/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Minha conta" };

export default async function MinhaContaPage() {
  const profile = await getCurrentProfile();
  const pedidos = await listarMeusPedidos();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink sm:text-4xl">
            Minha conta
          </h1>
          <p className="mt-1 text-sm text-muted">{profile.nome}</p>
        </div>
        <div className="w-full sm:w-auto">
          <LogoutButton />
        </div>
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-extrabold uppercase tracking-wide text-ink">
        Meus pedidos
      </h2>

      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line2 px-6 py-16 text-center">
          <Package className="h-7 w-7 text-muted2" strokeWidth={1.4} />
          <p className="text-sm text-muted">Você ainda não fez nenhum pedido.</p>
          <Link
            href="/produtos"
            className="mt-2 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {pedidos.map((pedido) => (
            <li key={pedido.numero}>
              <Link
                href={`/pedido/${pedido.numero}`}
                className="flex items-center gap-4 rounded-xl border border-line p-4 transition hover:border-ink"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">#{pedido.numero}</span>
                    <Badge tone={STATUS_TONE[pedido.status]}>{STATUS_LABEL[pedido.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatData(pedido.criadoEm)} · {pedido.quantidadeItens}{" "}
                    {pedido.quantidadeItens === 1 ? "item" : "itens"}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-ink">{formatBRL(pedido.total)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted2" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
