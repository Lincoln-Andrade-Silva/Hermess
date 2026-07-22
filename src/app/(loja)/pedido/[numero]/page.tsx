import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatBRL, formatDataHora } from "@/lib/format";
import { Badge } from "@/components/ui";
import { buscarMeuPedido } from "@/features/pedidos/actions";
import { STATUS_LABEL, STATUS_TONE } from "@/features/pedidos/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pedido" };

export default async function PedidoPage({ params }: { params: { numero: string } }) {
  const numero = Number(params.numero);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const pedido = await buscarMeuPedido(numero);
  if (!pedido) notFound();

  const aguardando = pedido.status === "aguardando_pagamento";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        {aguardando && <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" strokeWidth={1.5} />}
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-wide text-ink">
          Pedido #{pedido.numero}
        </h1>
        <div className="mt-2 flex justify-center">
          <Badge tone={STATUS_TONE[pedido.status]}>{STATUS_LABEL[pedido.status]}</Badge>
        </div>
      </div>

      {aguardando && (
        <p className="mt-6 rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          Reservamos seu estoque até {formatDataHora(pedido.expiraEm)}. O pagamento estará
          disponível em breve.
        </p>
      )}

      <div className="mt-8 space-y-3 rounded-2xl border border-line p-5">
        {pedido.itens.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-ink">{item.nomeProduto}</p>
              <p className="text-xs text-muted">
                {Object.values(item.combinacao).join(" · ")}
                {" · "}
                {item.quantidade}x
              </p>
            </div>
            <span className="shrink-0 font-medium text-ink">
              {formatBRL(Number(item.precoUnitario) * item.quantidade)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line pt-3 text-base font-semibold text-ink">
          <span>Total</span>
          <span>{formatBRL(pedido.total)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line p-5 text-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-muted2">Retirada</p>
        <p className="mt-1 text-ink">{pedido.nome}</p>
        <p className="text-muted">{pedido.telefone}</p>
        <p className="mt-2 text-xs text-muted2">Feito em {formatDataHora(pedido.criadoEm)}</p>
      </div>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/minha-conta"
          className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition hover:border-ink"
        >
          Meus pedidos
        </Link>
        <Link
          href="/produtos"
          className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-bg transition hover:bg-brand-dark"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
