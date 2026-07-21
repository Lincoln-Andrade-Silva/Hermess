"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "./input";
import { montarUrl } from "@/lib/pagination";

interface DataTableServerProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  page: number;
  pageCount: number;
  searchPlaceholder?: string;
  filter?: React.ReactNode;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

/** Listagem paginada no servidor: busca e página vivem na URL (`q`, `page`). */
export function DataTableServer<T>({
  columns,
  data,
  page,
  pageCount,
  searchPlaceholder = "Buscar...",
  filter,
  actions,
  emptyMessage = "Nenhum registro encontrado.",
}: DataTableServerProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("q") ?? "");
  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const t = setTimeout(() => {
      router.replace(montarUrl(pathname, searchParams, { q: busca || null, page: null }));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const rows = table.getRowModel().rows;

  function irPara(p: number) {
    router.replace(montarUrl(pathname, searchParams, { page: p > 1 ? String(p) : null }));
  }

  const paginacaoBtn =
    "inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6 sm:space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted2" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 pl-10"
            />
          </div>
          {filter}
        </div>
        {actions && <div className="sm:shrink-0">{actions}</div>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface/40">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted2"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-surface/40">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Página {page} de {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => irPara(page - 1)}
              disabled={page <= 1}
              className={paginacaoBtn}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => irPara(page + 1)}
              disabled={page >= pageCount}
              className={paginacaoBtn}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
