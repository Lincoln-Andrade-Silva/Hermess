"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Categoria } from "@/db/schema";
import {
  Badge,
  Button,
  ConfirmModal,
  DataTable,
  Field,
  FormError,
  Input,
  Modal,
  PageHeader,
  Toggle,
} from "@/components/ui";
import { excluirCategoria, salvarCategoria } from "./actions";

interface Rascunho {
  nome: string;
  ordem: string;
  ativo: boolean;
}

const RASCUNHO_VAZIO: Rascunho = { nome: "", ordem: "0", ativo: true };

export function CategoriasClient({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const [salvando, iniciarSalvamento] = useTransition();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<Categoria | null>(null);

  function abrirNova() {
    setEditando(null);
    setRascunho(RASCUNHO_VAZIO);
    setErro(null);
    setAberto(true);
  }

  function abrirEdicao(categoria: Categoria) {
    setEditando(categoria);
    setRascunho({
      nome: categoria.nome,
      ordem: String(categoria.ordem),
      ativo: categoria.ativo,
    });
    setErro(null);
    setAberto(true);
  }

  function salvar() {
    setErro(null);
    iniciarSalvamento(async () => {
      const resultado = await salvarCategoria(editando?.id ?? null, {
        nome: rascunho.nome,
        ordem: rascunho.ordem,
        ativo: rascunho.ativo,
      });
      if (!resultado.ok) {
        setErro(resultado.erro ?? "Não foi possível salvar.");
        return;
      }
      setAberto(false);
      router.refresh();
    });
  }

  function confirmarExclusao() {
    if (!excluindo) return;
    iniciarSalvamento(async () => {
      const resultado = await excluirCategoria(excluindo.id);
      if (!resultado.ok) {
        setErro(resultado.erro ?? "Não foi possível excluir.");
      }
      setExcluindo(null);
      router.refresh();
    });
  }

  const colunas: ColumnDef<Categoria>[] = [
    { accessorKey: "nome", header: "Nome" },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <span className="text-muted">/{row.original.slug}</span>,
    },
    { accessorKey: "ordem", header: "Ordem" },
    {
      id: "ativo",
      header: "Situação",
      cell: ({ row }) =>
        row.original.ativo ? (
          <Badge tone="success">Ativa</Badge>
        ) : (
          <Badge tone="muted">Inativa</Badge>
        ),
    },
    {
      id: "acoes",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => abrirEdicao(row.original)}
            aria-label={`Editar ${row.original.nome}`}
            className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
          >
            <Pencil className="h-4 w-4" />
          </button>
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
      <PageHeader title="Categorias" description="Agrupam os produtos na vitrine." />

      {erro && !aberto && (
        <div className="mb-4">
          <FormError>{erro}</FormError>
        </div>
      )}

      <DataTable
        columns={colunas}
        data={categorias}
        searchPlaceholder="Buscar categoria..."
        emptyMessage="Nenhuma categoria cadastrada."
        actions={
          <Button onClick={abrirNova} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        }
      />

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title={editando ? "Editar categoria" : "Nova categoria"}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
            <Field label="Nome" htmlFor="cat-nome">
              <Input
                id="cat-nome"
                value={rascunho.nome}
                onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                placeholder="Nome da categoria"
              />
            </Field>
            <Field label="Ordem" htmlFor="cat-ordem">
              <Input
                id="cat-ordem"
                type="number"
                min={0}
                value={rascunho.ordem}
                onChange={(e) => setRascunho({ ...rascunho, ordem: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium">Categoria ativa</p>
              <p className="text-xs text-muted">Inativa some da vitrine, mas mantém os produtos.</p>
            </div>
            <Toggle
              on={rascunho.ativo}
              onClick={() => setRascunho({ ...rascunho, ativo: !rascunho.ativo })}
            />
          </div>

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

      <ConfirmModal
        open={excluindo !== null}
        onClose={() => setExcluindo(null)}
        onConfirm={confirmarExclusao}
        loading={salvando}
        title="Excluir categoria"
        confirmLabel="Excluir"
        message={
          <>
            Excluir <strong className="text-ink">{excluindo?.nome}</strong>? Categorias com produtos
            não podem ser removidas.
          </>
        }
      />
    </>
  );
}
