"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Badge, ConfirmModal, DataTableServer, UrlSelect } from "@/components/ui";
import { formatBRL, formatData } from "@/lib/format";
import { excluirPedido } from "./admin-actions";
import { STATUS_LABEL, STATUS_TONE } from "./status";
import type { ListagemPedidos, PedidoLinha } from "./admin-actions";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

/** Pedido com pagamento ativo não some da lista — precisa ser cancelado antes. */
const NAO_EXCLUIVEIS = ["pago", "separando", "pronto_para_retirada"];

function StatusCelula({ pedido }: { pedido: PedidoLinha }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge tone={STATUS_TONE[pedido.status]}>{STATUS_LABEL[pedido.status]}</Badge>
      {pedido.pendenciaEstoque && (
        <AlertTriangle className="h-4 w-4 text-amber-600" aria-label="Pendência de estoque" />
      )}
    </div>
  );
}

/** Botão de excluir com confirmação. Some quando o pedido tem pagamento ativo. */
function ExcluirPedido({ pedido }: { pedido: PedidoLinha }) {
  const router = useRouter();
  const [processando, iniciar] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (NAO_EXCLUIVEIS.includes(pedido.status)) return null;

  function excluir() {
    iniciar(async () => {
      const r = await excluirPedido(pedido.numero);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível excluir.");
        return;
      }
      setConfirmar(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setConfirmar(true);
        }}
        aria-label={`Excluir pedido ${pedido.numero}`}
        className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmModal
        open={confirmar}
        onClose={() => {
          setConfirmar(false);
          setErro(null);
        }}
        onConfirm={excluir}
        loading={processando}
        title="Excluir pedido"
        confirmLabel="Excluir"
        message={
          erro ?? `O pedido #${pedido.numero} será removido em definitivo. Esta ação não pode ser desfeita.`
        }
      />
    </>
  );
}

const columns: ColumnDef<PedidoLinha>[] = [
  {
    accessorKey: "numero",
    header: "Pedido",
    cell: ({ row }) => (
      <Link
        href={`/admin/pedidos/${row.original.numero}`}
        className="font-semibold text-ink transition hover:text-brand"
      >
        #{row.original.numero}
      </Link>
    ),
  },
  {
    accessorKey: "nome",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{row.original.nome}</p>
        <p className="text-xs text-muted">{row.original.telefone}</p>
      </div>
    ),
  },
  {
    accessorKey: "quantidadeItens",
    header: "Itens",
    cell: ({ row }) => <span className="text-muted">{row.original.quantidadeItens}</span>,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => <span className="font-medium text-ink">{formatBRL(row.original.total)}</span>,
  },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusCelula pedido={row.original} /> },
  {
    accessorKey: "criadoEm",
    header: "Data",
    cell: ({ row }) => <span className="text-muted">{formatData(row.original.criadoEm)}</span>,
  },
  {
    id: "acoes",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ExcluirPedido pedido={row.original} />
      </div>
    ),
  },
];

export function PedidosAdminClient({ lista }: { lista: ListagemPedidos }) {
  return (
    <DataTableServer
      columns={columns}
      data={lista.itens}
      page={lista.page}
      pageCount={lista.pageCount}
      searchPlaceholder="Buscar por nº, nome ou telefone"
      filter={<UrlSelect param="status" options={STATUS_OPTIONS} className="sm:w-52" />}
      rowHref={(pedido) => `/admin/pedidos/${pedido.numero}`}
      emptyMessage="Nenhum pedido encontrado."
      mobileCard={(pedido) => (
        <div className="flex items-center gap-2 rounded-2xl border border-line p-4">
          <Link
            href={`/admin/pedidos/${pedido.numero}`}
            className="flex min-w-0 flex-1 items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">#{pedido.numero}</span>
                <StatusCelula pedido={pedido} />
              </div>
              <p className="mt-1 truncate text-sm text-muted">{pedido.nome}</p>
              <p className="text-xs text-muted2">
                {formatData(pedido.criadoEm)} · {pedido.quantidadeItens}{" "}
                {pedido.quantidadeItens === 1 ? "item" : "itens"}
              </p>
            </div>
            <span className="shrink-0 font-semibold text-ink">{formatBRL(pedido.total)}</span>
          </Link>
          <ExcluirPedido pedido={pedido} />
        </div>
      )}
    />
  );
}
