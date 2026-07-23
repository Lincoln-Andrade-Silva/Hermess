"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { Badge, Button, DataTableServer, Field, FormError, Input, Modal, UrlSelect } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatBRL, formatDataHora } from "@/lib/format";
import { editarMovimentacao, type LinhaMovimentacao, type ListagemMovimentacoes } from "./actions";

type Tipo = LinhaMovimentacao["tipo"];

const TIPO_LABEL: Record<Tipo, string> = {
  entrada: "Entrada",
  ajuste: "Ajuste",
  venda: "Venda",
  devolucao: "Devolução",
};

const TIPO_TONE: Record<Tipo, "success" | "brand" | "muted" | "warning"> = {
  entrada: "success",
  ajuste: "brand",
  venda: "muted",
  devolucao: "warning",
};

const TIPO_OPTIONS = [
  { value: "todos", label: "Todos os tipos" },
  ...(Object.entries(TIPO_LABEL) as [Tipo, string][]).map(([value, label]) => ({ value, label })),
];

function Delta({ q }: { q: number }) {
  return (
    <span className={cn("font-semibold tabular-nums", q >= 0 ? "text-emerald-600" : "text-red-600")}>
      {q > 0 ? `+${q}` : q}
    </span>
  );
}

/** Custo total das peças da movimentação: custo unitário × quantidade. */
function custoTotal(m: LinhaMovimentacao): number | null {
  if (m.custoUnitario === null) return null;
  return Number(m.custoUnitario) * Math.abs(m.quantidade);
}

/** Edita metadados da movimentação (NF, custo unitário, motivo). */
function EditarCelula({ m }: { m: LinhaMovimentacao }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nf, setNf] = useState(m.nf ?? "");
  const [custo, setCusto] = useState(m.custoUnitario ?? "");
  const [motivo, setMotivo] = useState(m.motivo ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await editarMovimentacao(m.id, { nf, custoUnitario: custo, motivo });
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível salvar.");
        return;
      }
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Editar movimentação"
        className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Modal open={aberto} onClose={() => setAberto(false)} title="Editar movimentação" className="max-w-md">
        <div className="space-y-4">
          <div className="rounded-xl bg-surface/50 p-3 text-sm">
            <p className="font-medium text-ink">{m.produtoNome}</p>
            <p className="font-mono text-xs text-muted">{m.sku}</p>
          </div>

          <Field label="Nota fiscal" htmlFor="mov-nf" hint="(opcional)">
            <Input id="mov-nf" value={nf} onChange={(e) => setNf(e.target.value)} maxLength={100} />
          </Field>

          <Field label="Custo unitário" htmlFor="mov-custo" hint="(opcional)">
            <Input
              id="mov-custo"
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
            />
          </Field>

          <Field label="Motivo" htmlFor="mov-motivo" hint="(opcional)">
            <Input
              id="mov-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={200}
            />
          </Field>

          {erro && <FormError>{erro}</FormError>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const columns: ColumnDef<LinhaMovimentacao>[] = [
  {
    accessorKey: "criadoEm",
    header: "Quando",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted">{formatDataHora(row.original.criadoEm)}</span>
    ),
  },
  {
    accessorKey: "produtoNome",
    header: "Produto",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{row.original.produtoNome}</p>
        <p className="truncate font-mono text-xs text-muted">{row.original.sku}</p>
      </div>
    ),
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => <Badge tone={TIPO_TONE[row.original.tipo]}>{TIPO_LABEL[row.original.tipo]}</Badge>,
  },
  { accessorKey: "quantidade", header: "Qtd", cell: ({ row }) => <Delta q={row.original.quantidade} /> },
  {
    accessorKey: "estoqueResultante",
    header: "Saldo",
    cell: ({ row }) => <span className="tabular-nums text-ink">{row.original.estoqueResultante}</span>,
  },
  {
    id: "custo",
    header: "Custo",
    cell: ({ row }) => {
      const total = custoTotal(row.original);
      return total !== null ? (
        <span className="whitespace-nowrap tabular-nums text-ink">{formatBRL(total)}</span>
      ) : (
        <span className="text-muted2">-</span>
      );
    },
  },
  {
    accessorKey: "nf",
    header: "NF",
    cell: ({ row }) => <span className="text-muted">{row.original.nf ?? "-"}</span>,
  },
  {
    accessorKey: "motivo",
    header: "Motivo",
    cell: ({ row }) => (
      <span className="text-muted">
        {row.original.motivo ?? (row.original.usuarioNome ? "-" : "automático")}
      </span>
    ),
  },
  {
    id: "acoes",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <EditarCelula m={row.original} />
      </div>
    ),
  },
];

export function MovimentacoesClient({ lista }: { lista: ListagemMovimentacoes }) {
  return (
    <DataTableServer
      columns={columns}
      data={lista.itens}
      page={lista.page}
      pageCount={lista.pageCount}
      searchPlaceholder="Buscar movimentação"
      filter={<UrlSelect param="tipo" options={TIPO_OPTIONS} className="sm:w-52" />}
      emptyMessage="Nenhuma movimentação registrada."
      mobileCard={(m) => (
        <div className="rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge tone={TIPO_TONE[m.tipo]}>{TIPO_LABEL[m.tipo]}</Badge>
            <div className="flex items-center gap-1">
              <Delta q={m.quantidade} />
              <EditarCelula m={m} />
            </div>
          </div>
          <p className="mt-2 truncate text-sm font-medium text-ink">{m.produtoNome}</p>
          <p className="truncate font-mono text-xs text-muted">{m.sku}</p>
          <p className="mt-1 text-xs text-muted2">
            {formatDataHora(m.criadoEm)} · saldo {m.estoqueResultante}
          </p>
          {(custoTotal(m) !== null || m.nf) && (
            <p className="text-xs text-muted2">
              {custoTotal(m) !== null && `Custo ${formatBRL(custoTotal(m)!)}`}
              {custoTotal(m) !== null && m.nf && " · "}
              {m.nf && `NF ${m.nf}`}
            </p>
          )}
        </div>
      )}
    />
  );
}
