"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import {
  Badge,
  Button,
  DataTableServer,
  Field,
  FormError,
  Input,
  Modal,
  Select,
  Toggle,
  UrlSelect,
} from "@/components/ui";
import { formatData } from "@/lib/format";
import { atualizarUsuario, type LinhaUsuario, type ListagemUsuarios } from "./actions";

const TIPO_LABEL: Record<string, string> = { admin: "Admin", cliente: "Cliente" };

const TIPO_OPTIONS = [
  { value: "todos", label: "Todos os tipos" },
  { value: "admin", label: "Admin" },
  { value: "cliente", label: "Cliente" },
];
const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

function EditarUsuario({ usuario }: { usuario: LinhaUsuario }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(usuario.nome);
  const [tipo, setTipo] = useState<LinhaUsuario["tipo"]>(usuario.tipo);
  const [ativo, setAtivo] = useState(usuario.status === "ativo");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await atualizarUsuario(usuario.id, {
        nome,
        tipo,
        status: ativo ? "ativo" : "inativo",
      });
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
        aria-label={`Editar ${usuario.nome}`}
        className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Modal open={aberto} onClose={() => setAberto(false)} title="Editar usuário" className="max-w-md">
        <div className="space-y-5">
          <div className="rounded-xl bg-surface/50 p-3 text-sm">
            <p className="font-medium text-ink">{usuario.email}</p>
            <p className="text-xs text-muted">
              Cadastrado em {formatData(usuario.criadoEm)}
              {usuario.telefone ? ` · ${usuario.telefone}` : ""}
            </p>
          </div>

          <Field label="Nome" htmlFor="usr-nome">
            <Input id="usr-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
          </Field>

          <Field label="Tipo" htmlFor="usr-tipo">
            <Select
              value={tipo}
              onChange={(v) => setTipo(v as LinhaUsuario["tipo"])}
              options={[
                { value: "cliente", label: "Cliente" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium">Usuário ativo</p>
              <p className="text-xs text-muted">Inativo não consegue entrar.</p>
            </div>
            <Toggle on={ativo} onClick={() => setAtivo(!ativo)} />
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
    </>
  );
}

const columns: ColumnDef<LinhaUsuario>[] = [
  {
    accessorKey: "nome",
    header: "Usuário",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{row.original.nome}</p>
        <p className="truncate text-xs text-muted">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) =>
      row.original.telefone ? (
        <span className="text-muted">{row.original.telefone}</span>
      ) : (
        <span className="text-muted2">—</span>
      ),
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => (
      <Badge tone={row.original.tipo === "admin" ? "brand" : "muted"}>
        {TIPO_LABEL[row.original.tipo]}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status === "ativo" ? (
        <Badge tone="success">Ativo</Badge>
      ) : (
        <Badge tone="danger">Inativo</Badge>
      ),
  },
  {
    accessorKey: "criadoEm",
    header: "Cadastro",
    cell: ({ row }) => <span className="text-muted">{formatData(row.original.criadoEm)}</span>,
  },
  {
    id: "acoes",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <EditarUsuario usuario={row.original} />
      </div>
    ),
  },
];

export function UsuariosClient({ lista }: { lista: ListagemUsuarios }) {
  return (
    <DataTableServer
      columns={columns}
      data={lista.itens}
      page={lista.page}
      pageCount={lista.pageCount}
      searchPlaceholder="Buscar por nome ou e-mail"
      filter={
        <div className="flex flex-col gap-2 sm:flex-row">
          <UrlSelect param="tipo" options={TIPO_OPTIONS} className="sm:w-44" />
          <UrlSelect param="status" options={STATUS_OPTIONS} className="sm:w-44" />
        </div>
      }
      emptyMessage="Nenhum usuário encontrado."
      mobileCard={(u) => (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{u.nome}</p>
            <p className="truncate text-xs text-muted">{u.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge tone={u.tipo === "admin" ? "brand" : "muted"}>{TIPO_LABEL[u.tipo]}</Badge>
              {u.status === "ativo" ? (
                <Badge tone="success">Ativo</Badge>
              ) : (
                <Badge tone="danger">Inativo</Badge>
              )}
            </div>
          </div>
          <EditarUsuario usuario={u} />
        </div>
      )}
    />
  );
}
