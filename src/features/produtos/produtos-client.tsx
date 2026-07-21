"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, ConfirmModal, DataTableServer, UrlSelect } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { excluirProduto, type ProdutoDaLista } from "./actions";

export function ProdutosClient({
  itens,
  page,
  pageCount,
  categorias,
}: {
  itens: ProdutoDaLista[];
  page: number;
  pageCount: number;
  categorias: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [processando, iniciar] = useTransition();
  const [excluindo, setExcluindo] = useState<ProdutoDaLista | null>(null);

  function confirmarExclusao() {
    if (!excluindo) return;
    iniciar(async () => {
      await excluirProduto(excluindo.id);
      setExcluindo(null);
      router.refresh();
    });
  }

  const colunas: ColumnDef<ProdutoDaLista>[] = [
    {
      id: "produto",
      header: "Produto",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
            {row.original.imagemUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.original.imagemUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.original.nome}</p>
            <p className="truncate text-xs text-muted">
              {row.original.categoriaNome ?? "Sem categoria"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "preco",
      header: "Preço",
      cell: ({ row }) => {
        const { precoMin, precoMax } = row.original;
        if (!precoMin) return <span className="text-muted2">—</span>;
        return (
          <span className="whitespace-nowrap">
            {formatBRL(precoMin)}
            {precoMax && precoMax !== precoMin && ` – ${formatBRL(precoMax)}`}
          </span>
        );
      },
    },
    {
      id: "variacoes",
      header: "Variações",
      cell: ({ row }) => <span className="text-muted">{row.original.variacoes}</span>,
    },
    {
      id: "estoque",
      header: "Estoque",
      cell: ({ row }) => {
        const { estoque } = row.original;
        if (estoque === 0) return <Badge tone="danger">Esgotado</Badge>;
        if (estoque <= 5) return <Badge tone="warning">{estoque} restantes</Badge>;
        return <span>{estoque}</span>;
      },
    },
    {
      id: "ativo",
      header: "Situação",
      cell: ({ row }) =>
        row.original.ativo ? (
          <Badge tone="success">Ativo</Badge>
        ) : (
          <Badge tone="muted">Inativo</Badge>
        ),
    },
    {
      id: "acoes",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/produtos/${row.original.id}`}
            aria-label={`Editar ${row.original.nome}`}
            className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setExcluindo(row.original)}
            aria-label={`Excluir ${row.original.nome}`}
            className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTableServer
        columns={colunas}
        data={itens}
        page={page}
        pageCount={pageCount}
        searchPlaceholder="Buscar produto..."
        emptyMessage="Nenhum produto cadastrado."
        mobileCard={(produto) => (
          <div className="flex gap-3 rounded-2xl border border-line p-3">
            <div className="h-24 w-[72px] shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
              {produto.imagemUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={produto.imagemUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 font-medium leading-tight text-ink">{produto.nome}</p>
                {!produto.ativo && <Badge tone="muted">Inativo</Badge>}
              </div>

              <p className="text-xs text-muted">{produto.categoriaNome ?? "Sem categoria"}</p>

              <p className="text-sm font-semibold text-ink">
                {produto.precoMin ? (
                  <>
                    {formatBRL(produto.precoMin)}
                    {produto.precoMax &&
                      produto.precoMax !== produto.precoMin &&
                      ` – ${formatBRL(produto.precoMax)}`}
                  </>
                ) : (
                  <span className="text-muted2">sem preço</span>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">
                  {produto.variacoes} variaç{produto.variacoes === 1 ? "ão" : "ões"}
                </span>
                {produto.estoque === 0 ? (
                  <Badge tone="danger">Esgotado</Badge>
                ) : produto.estoque <= 5 ? (
                  <Badge tone="warning">{produto.estoque} restantes</Badge>
                ) : (
                  <span className="text-xs text-muted">{produto.estoque} em estoque</span>
                )}
              </div>

              <div className="mt-1 flex gap-2">
                <Link
                  href={`/admin/produtos/${produto.id}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-medium text-ink transition hover:bg-surface"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => setExcluindo(produto)}
                  aria-label={`Excluir ${produto.nome}`}
                  className="rounded-lg border border-line px-3 py-2 text-muted transition hover:border-red-600 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
        filter={
          <UrlSelect
            param="categoria"
            className="w-full sm:w-44"
            options={[
              { value: "todos", label: "Todas as categorias" },
              ...categorias.map((c) => ({ value: c.id, label: c.nome })),
            ]}
          />
        }
        actions={
          <Link
            href="/admin/produtos/novo"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white shadow-brand transition hover:-translate-y-px hover:bg-brand-dark hover:shadow-brand-lg sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </Link>
        }
      />

      <ConfirmModal
        open={excluindo !== null}
        onClose={() => setExcluindo(null)}
        onConfirm={confirmarExclusao}
        loading={processando}
        title="Excluir produto"
        confirmLabel="Excluir"
        message={
          <>
            Excluir <strong className="text-ink">{excluindo?.nome}</strong>? As variações e as
            imagens vão junto, e isso não tem volta.
          </>
        }
      />
    </>
  );
}
