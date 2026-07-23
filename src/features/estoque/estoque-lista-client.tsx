"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PackagePlus } from "lucide-react";
import {
  Badge,
  Button,
  DataTableServer,
  Field,
  FormError,
  Input,
  Modal,
  Select,
  UrlSelect,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { montarUrl } from "@/lib/pagination";

/** Custo travado no estoque atual: estoque × custo unitário. */
function custoEmEstoque(l: LinhaEstoque): number {
  return l.estoque * Number(l.precoCusto);
}

/** Motivos sugeridos por tipo de movimentação; "Outros" abre campo livre. */
const MOTIVOS: Record<"entrada" | "ajuste", string[]> = {
  entrada: ["Reposição", "Coleção nova", "Compra", "Devolução de cliente", "Outros"],
  ajuste: ["Contagem / inventário", "Avaria", "Perda", "Correção de cadastro", "Outros"],
};
import { ajustarEstoque, registrarEntrada, type LinhaEstoque, type ListagemEstoque } from "./actions";

/** Modal de entrada (recebimento) ou ajuste (correção) de uma variação. */
function AjusteModal({
  linha,
  onClose,
  onDone,
}: {
  linha: LinhaEstoque;
  onClose: () => void;
  onDone: () => void;
}) {
  const [modo, setModo] = useState<"entrada" | "ajuste">("entrada");
  const [valor, setValor] = useState("");
  const [nf, setNf] = useState("");
  const [motivoOpcao, setMotivoOpcao] = useState(MOTIVOS.entrada[0]);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function trocarModo(m: "entrada" | "ajuste") {
    setModo(m);
    setValor("");
    setMotivoOpcao(MOTIVOS[m][0]);
    setMotivoTexto("");
    setErro(null);
  }

  function salvar() {
    setErro(null);
    const n = Number(valor);
    if (!Number.isFinite(n)) {
      setErro("Informe um número.");
      return;
    }
    const motivo = motivoOpcao === "Outros" ? motivoTexto.trim() || "Outros" : motivoOpcao;
    iniciar(async () => {
      const r =
        modo === "entrada"
          ? await registrarEntrada(linha.variacaoId, n, motivo, nf)
          : await ajustarEstoque(linha.variacaoId, n, motivo);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível salvar.");
        return;
      }
      onDone();
    });
  }

  return (
    <Modal open onClose={onClose} title="Movimentar estoque" className="max-w-md">
      <div className="space-y-5">
        <div className="rounded-xl bg-surface/50 p-4 text-sm">
          <p className="font-medium text-ink">{linha.produtoNome}</p>
          <p className="font-mono text-xs text-muted">SKU {linha.sku}</p>
          <div className="mt-3 flex gap-4 text-xs">
            <span>
              Estoque <strong className="text-ink">{linha.estoque}</strong>
            </span>
            {linha.reservado > 0 && (
              <span className="text-muted">
                Reservado <strong>{linha.reservado}</strong>
              </span>
            )}
            <span>
              Disponível <strong className="text-ink">{linha.disponivel}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
          {(["entrada", "ajuste"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => trocarModo(m)}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition",
                modo === m ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {m === "entrada" ? "Entrada" : "Ajuste"}
            </button>
          ))}
        </div>

        <Field
          label={modo === "entrada" ? "Quantidade a adicionar" : "Novo estoque"}
          htmlFor="est-valor"
          hint={modo === "entrada" ? "(recebimento)" : "(corrige o total)"}
        >
          <Input
            id="est-valor"
            type="number"
            min={0}
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={modo === "entrada" ? "0" : String(linha.estoque)}
            autoFocus
          />
        </Field>

        {modo === "entrada" && (
          <Field label="Nota fiscal" htmlFor="est-nf" hint="(opcional)">
            <Input
              id="est-nf"
              value={nf}
              onChange={(e) => setNf(e.target.value)}
              placeholder="Número/série da NF"
              maxLength={100}
            />
          </Field>
        )}

        <Field label="Motivo" htmlFor="est-motivo">
          <Select
            value={motivoOpcao}
            onChange={setMotivoOpcao}
            options={MOTIVOS[modo].map((m) => ({ value: m, label: m }))}
          />
        </Field>

        {motivoOpcao === "Outros" && (
          <Field label="Descreva o motivo" htmlFor="est-motivo-outro">
            <Input
              id="est-motivo-outro"
              value={motivoTexto}
              onChange={(e) => setMotivoTexto(e.target.value)}
              placeholder="Digite o motivo"
              maxLength={200}
              autoFocus
            />
          </Field>
        )}

        {erro && <FormError>{erro}</FormError>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || !valor.trim()}>
            {salvando ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FiltroBaixo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ativo = searchParams.get("baixo") === "1";

  function alternar() {
    router.replace(montarUrl(pathname, searchParams, { baixo: ativo ? null : "1", page: null }));
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className={cn(
        "h-[50px] whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition",
        ativo ? "border-amber-500 bg-amber-50 text-amber-700" : "border-line text-muted hover:text-ink",
      )}
    >
      Só estoque baixo
    </button>
  );
}

export function EstoqueListaClient({
  lista,
  categorias,
}: {
  lista: ListagemEstoque;
  categorias: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<LinhaEstoque | null>(null);

  const categoriaOptions = [{ value: "todas", label: "Todas as categorias" }, ...categorias];

  const columns: ColumnDef<LinhaEstoque>[] = [
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
      accessorKey: "estoque",
      header: "Estoque",
      cell: ({ row }) => {
        const baixo = row.original.estoque <= lista.limite;
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{row.original.estoque}</span>
            {baixo && <Badge tone="warning">baixo</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "reservado",
      header: "Reservado",
      cell: ({ row }) =>
        row.original.reservado > 0 ? (
          <span className="text-muted">{row.original.reservado}</span>
        ) : (
          <span className="text-muted2">-</span>
        ),
    },
    {
      accessorKey: "disponivel",
      header: "Disponível",
      cell: ({ row }) => <span className="text-muted">{row.original.disponivel}</span>,
    },
    {
      id: "custoEstoque",
      header: "Custo em estoque",
      cell: ({ row }) =>
        Number(row.original.precoCusto) > 0 ? (
          <span className="whitespace-nowrap tabular-nums text-ink">
            {formatBRL(custoEmEstoque(row.original))}
          </span>
        ) : (
          <span className="text-muted2">-</span>
        ),
    },
    {
      id: "acoes",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setEditando(row.original)}>
            <PackagePlus className="h-4 w-4" />
            Movimentar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTableServer
        columns={columns}
        data={lista.itens}
        page={lista.page}
        pageCount={lista.pageCount}
        searchPlaceholder="Buscar por produto ou SKU"
        filter={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UrlSelect
              param="categoria"
              options={categoriaOptions}
              defaultValue="todas"
              className="sm:w-52"
            />
            <FiltroBaixo />
          </div>
        }
        emptyMessage="Nenhuma variação encontrada."
        mobileCard={(linha) => {
          const baixo = linha.estoque <= lista.limite;
          return (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{linha.produtoNome}</p>
                <p className="truncate font-mono text-xs text-muted">{linha.sku}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span>
                    Estoque <strong className="text-ink">{linha.estoque}</strong>
                  </span>
                  {baixo && <Badge tone="warning">baixo</Badge>}
                  <span className="text-muted">disp. {linha.disponivel}</span>
                  {Number(linha.precoCusto) > 0 && (
                    <span className="text-muted">custo {formatBRL(custoEmEstoque(linha))}</span>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditando(linha)}>
                <PackagePlus className="h-4 w-4" />
              </Button>
            </div>
          );
        }}
      />

      {editando && (
        <AjusteModal
          linha={editando}
          onClose={() => setEditando(null)}
          onDone={() => {
            setEditando(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
