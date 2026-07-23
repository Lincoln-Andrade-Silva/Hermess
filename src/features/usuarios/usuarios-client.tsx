"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  ConfirmModal,
  DataTableServer,
  Field,
  FormError,
  Input,
  Modal,
  Select,
  Toggle,
  UrlSelect,
} from "@/components/ui";
import { formatData, maskTelefone } from "@/lib/format";
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  type LinhaUsuario,
  type ListagemUsuarios,
} from "./actions";

function CriarUsuario() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<LinhaUsuario["tipo"]>("cliente");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function abrir() {
    setNome("");
    setEmail("");
    setSenha("");
    setTipo("cliente");
    setErro(null);
    setAberto(true);
  }

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await criarUsuario({ nome, email, senha, tipo });
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível criar.");
        return;
      }
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={abrir} className="w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Novo usuário
      </Button>

      <Modal open={aberto} onClose={() => setAberto(false)} title="Novo usuário" className="max-w-md">
        <div className="space-y-4">
          <Field label="Nome" htmlFor="novo-nome">
            <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
          </Field>
          <Field label="E-mail" htmlFor="novo-email">
            <Input
              id="novo-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Senha" htmlFor="novo-senha" hint="(mínimo 6)">
            <Input
              id="novo-senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Tipo" htmlFor="novo-tipo">
            <Select
              value={tipo}
              onChange={(v) => setTipo(v as LinhaUsuario["tipo"])}
              options={[
                { value: "cliente", label: "Cliente" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </Field>

          {erro && <FormError>{erro}</FormError>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Criando..." : "Criar usuário"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

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
  const [email, setEmail] = useState(usuario.email);
  const [telefone, setTelefone] = useState(maskTelefone(usuario.telefone ?? ""));
  const [tipo, setTipo] = useState<LinhaUsuario["tipo"]>(usuario.tipo);
  const [ativo, setAtivo] = useState(usuario.status === "ativo");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await atualizarUsuario(usuario.id, {
        nome,
        email,
        telefone: telefone.trim() || null,
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
          <Field label="Nome" htmlFor="usr-nome">
            <Input id="usr-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
          </Field>

          <Field label="E-mail" htmlFor="usr-email">
            <Input
              id="usr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </Field>

          <Field label="Telefone" htmlFor="usr-telefone" hint="(opcional)">
            <Input
              id="usr-telefone"
              value={telefone}
              onChange={(e) => setTelefone(maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              maxLength={16}
            />
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

function ExcluirUsuario({ usuario }: { usuario: LinhaUsuario }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, iniciar] = useTransition();

  function abrir() {
    setErro(null);
    setAberto(true);
  }

  function confirmar() {
    setErro(null);
    iniciar(async () => {
      const r = await excluirUsuario(usuario.id);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível excluir.");
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
        onClick={abrir}
        aria-label={`Excluir ${usuario.nome}`}
        className="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmModal
        open={aberto}
        onClose={() => setAberto(false)}
        onConfirm={confirmar}
        title="Excluir usuário"
        confirmLabel="Excluir"
        loading={excluindo}
        message={
          <div className="space-y-3">
            <p>
              Excluir <span className="font-medium text-ink">{usuario.nome}</span>? Esta ação não
              pode ser desfeita.
            </p>
            {erro && <FormError>{erro}</FormError>}
          </div>
        }
      />
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
        <span className="text-muted2">-</span>
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
      <div className="flex justify-end gap-1">
        <EditarUsuario usuario={row.original} />
        <ExcluirUsuario usuario={row.original} />
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
      actions={<CriarUsuario />}
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
          <div className="flex shrink-0 gap-1">
            <EditarUsuario usuario={u} />
            <ExcluirUsuario usuario={u} />
          </div>
        </div>
      )}
    />
  );
}
