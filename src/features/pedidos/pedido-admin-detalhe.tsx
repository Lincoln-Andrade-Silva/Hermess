"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ChevronLeft, ImageOff, RotateCcw } from "lucide-react";
import { Badge, Button, ConfirmModal, FormError } from "@/components/ui";
import { formatBRL, formatDataHora } from "@/lib/format";
import {
  aprovarReembolso,
  avancarStatus,
  cancelarPedido,
  devolverEstoqueReembolso,
  recusarReembolso,
  type PedidoAdminDetalhe,
} from "./admin-actions";
import {
  AVANCAR_LABEL,
  CANCELAVEIS,
  PROXIMO_STATUS,
  REEMBOLSO_LABEL,
  REEMBOLSO_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from "./status";

const METODO_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  credito: "Crédito",
  debito: "Débito",
};

export function PedidoAdminDetalheView({ pedido }: { pedido: PedidoAdminDetalhe }) {
  const router = useRouter();
  const [processando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [confirmarAprovar, setConfirmarAprovar] = useState(false);
  const [confirmarRecusar, setConfirmarRecusar] = useState(false);

  const proximo = PROXIMO_STATUS[pedido.status];
  const podeCancelar = CANCELAVEIS.includes(pedido.status);
  const estornaAoCancelar = pedido.gatewayPagamentoId && pedido.status !== "aguardando_pagamento";
  const reembolsoPendente = pedido.reembolso === "solicitado";
  const estornaAoAprovar = Boolean(pedido.gatewayPagamentoId);

  function avancar() {
    setErro(null);
    iniciar(async () => {
      const r = await avancarStatus(pedido.numero);
      if (!r.ok) setErro(r.erro ?? "Não foi possível avançar.");
      else router.refresh();
    });
  }

  function cancelar() {
    setErro(null);
    iniciar(async () => {
      const r = await cancelarPedido(pedido.numero);
      setConfirmarCancelar(false);
      if (!r.ok) setErro(r.erro ?? "Não foi possível cancelar.");
      else router.refresh();
    });
  }

  function aprovar() {
    setErro(null);
    iniciar(async () => {
      const r = await aprovarReembolso(pedido.numero);
      setConfirmarAprovar(false);
      if (!r.ok) setErro(r.erro ?? "Não foi possível aprovar.");
      else router.refresh();
    });
  }

  function recusar() {
    setErro(null);
    iniciar(async () => {
      const r = await recusarReembolso(pedido.numero);
      setConfirmarRecusar(false);
      if (!r.ok) setErro(r.erro ?? "Não foi possível recusar.");
      else router.refresh();
    });
  }

  function devolverEstoque() {
    setErro(null);
    iniciar(async () => {
      const r = await devolverEstoqueReembolso(pedido.numero);
      if (!r.ok) setErro(r.erro ?? "Não foi possível devolver ao estoque.");
      else router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/pedidos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        Pedidos
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink">
          Pedido #{pedido.numero}
        </h1>
        <Badge tone={STATUS_TONE[pedido.status]}>{STATUS_LABEL[pedido.status]}</Badge>
        {pedido.reembolso !== "nenhum" && (
          <Badge tone={REEMBOLSO_TONE[pedido.reembolso]}>{REEMBOLSO_LABEL[pedido.reembolso]}</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">Feito em {formatDataHora(pedido.criadoEm)}</p>

      {reembolsoPendente && (
        <div className="mt-4 rounded-2xl border border-amber-600/30 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <RotateCcw className="h-4 w-4" />
            Reembolso solicitado pelo cliente
          </div>
          {pedido.reembolsoMotivo && (
            <p className="mt-2 border-l-2 border-amber-600/40 pl-3 text-sm text-amber-800">
              {pedido.reembolsoMotivo}
            </p>
          )}
          <p className="mt-2 text-xs text-amber-800">
            {estornaAoAprovar
              ? "Aprovar estorna no Mercado Pago e cancela o pedido."
              : "Aprovar cancela o pedido (pagamento no balcão: devolva o valor em mãos)."}
            {pedido.status === "retirado"
              ? " Como já foi retirado, o estoque não volta automaticamente."
              : " O estoque será devolvido."}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setConfirmarRecusar(true)} disabled={processando}>
              Recusar
            </Button>
            <Button onClick={() => setConfirmarAprovar(true)} disabled={processando}>
              Aprovar reembolso
            </Button>
          </div>
        </div>
      )}

      {pedido.reembolsoEstoquePendente && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Reembolso aprovado com o pedido já retirado: o estoque não foi devolvido. Se a peça
              voltou, devolva ao estoque.
            </span>
          </div>
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={devolverEstoque}
            disabled={processando}
          >
            Devolver ao estoque
          </Button>
        </div>
      )}

      {pedido.pendenciaEstoque && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            O pagamento foi aprovado depois do pedido expirar, então o estoque não baixou
            automaticamente. Ajuste o estoque manualmente se necessário.
          </span>
        </div>
      )}

      <div className="mt-6 divide-y divide-line rounded-2xl border border-line">
        {pedido.itens.map((item, i) => (
          <ItemLinha key={i} item={item} />
        ))}
        <div className="flex items-center justify-between px-4 py-4 text-base font-semibold text-ink">
          <span>Total</span>
          <span>{formatBRL(pedido.total)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line p-5 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted2">Cliente</p>
          <p className="mt-1 text-ink">{pedido.nome}</p>
          <p className="text-muted">{pedido.telefone}</p>
        </div>
        <div className="rounded-2xl border border-line p-5 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted2">Pagamento</p>
          {pedido.canal === "pdv" ? (
            <p className="mt-1 text-ink">Balcão · {METODO_LABEL[pedido.metodoPagamento ?? ""] ?? "-"}</p>
          ) : pedido.gatewayPagamentoId ? (
            <p className="mt-1 text-ink">Mercado Pago #{pedido.gatewayPagamentoId}</p>
          ) : (
            <p className="mt-1 text-muted">Sem pagamento registrado</p>
          )}
        </div>
      </div>

      {erro && (
        <div className="mt-4">
          <FormError>{erro}</FormError>
        </div>
      )}

      {(proximo || podeCancelar) && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {podeCancelar && (
            <Button
              variant="secondary"
              onClick={() => setConfirmarCancelar(true)}
              disabled={processando}
            >
              Cancelar pedido
            </Button>
          )}
          {proximo && (
            <Button onClick={avancar} disabled={processando}>
              {AVANCAR_LABEL[pedido.status] ?? "Avançar"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmarCancelar}
        onClose={() => setConfirmarCancelar(false)}
        onConfirm={cancelar}
        loading={processando}
        title="Cancelar pedido"
        confirmLabel="Cancelar pedido"
        message={
          estornaAoCancelar
            ? "O pagamento será estornado no Mercado Pago e o estoque devolvido. Esta ação não pode ser desfeita."
            : "A reserva de estoque será liberada. Esta ação não pode ser desfeita."
        }
      />

      <ConfirmModal
        open={confirmarAprovar}
        onClose={() => setConfirmarAprovar(false)}
        onConfirm={aprovar}
        loading={processando}
        title="Aprovar reembolso"
        confirmLabel="Aprovar reembolso"
        message={
          estornaAoAprovar
            ? "O pagamento será estornado no Mercado Pago e o pedido cancelado. Esta ação não pode ser desfeita."
            : "O pedido será cancelado. Devolva o valor ao cliente em mãos. Esta ação não pode ser desfeita."
        }
      />

      <ConfirmModal
        open={confirmarRecusar}
        onClose={() => setConfirmarRecusar(false)}
        onConfirm={recusar}
        loading={processando}
        title="Recusar reembolso"
        confirmLabel="Recusar reembolso"
        message="O cliente será avisado de que o reembolso não foi aprovado. Nada é estornado."
      />
    </div>
  );
}

function ItemLinha({ item }: { item: PedidoAdminDetalhe["itens"][number] }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
        {item.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imagem} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <span className="flex h-full items-center justify-center text-muted2">
            <ImageOff className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-ink">{item.nomeProduto}</p>
        <p className="text-xs text-muted">
          {Object.values(item.combinacao).join(" · ")}
          {" · "}
          {item.quantidade}x · SKU {item.sku}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium text-ink">
        {formatBRL(Number(item.precoUnitario) * item.quantidade)}
      </span>
    </div>
  );
}
