"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { pedidos, profiles, type Profile } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { offsetDaPagina, PAGE_SIZE, parsePagina, totalPaginas } from "@/lib/pagination";
import { getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

export interface LinhaUsuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: Profile["tipo"];
  status: Profile["status"];
  criadoEm: Date;
}

export interface ListagemUsuarios {
  itens: LinhaUsuario[];
  page: number;
  pageCount: number;
}

const TIPOS = ["admin", "cliente"] as const;
const STATUS = ["ativo", "inativo"] as const;

export async function listarUsuarios(params: {
  q?: string;
  tipo?: string;
  status?: string;
  page?: string;
}): Promise<ListagemUsuarios> {
  await requireAdmin();
  const page = parsePagina(params.page);
  const q = params.q?.trim();

  const conds = [];
  if (q) {
    const like = or(ilike(profiles.nome, `%${q}%`), ilike(profiles.email, `%${q}%`));
    if (like) conds.push(like);
  }
  if (params.tipo && (TIPOS as readonly string[]).includes(params.tipo)) {
    conds.push(eq(profiles.tipo, params.tipo as Profile["tipo"]));
  }
  if (params.status && (STATUS as readonly string[]).includes(params.status)) {
    conds.push(eq(profiles.status, params.status as Profile["status"]));
  }
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], itens] = await Promise.all([
    db.select({ total: count() }).from(profiles).where(where),
    db
      .select({
        id: profiles.id,
        nome: profiles.nome,
        email: profiles.email,
        telefone: profiles.telefone,
        tipo: profiles.tipo,
        status: profiles.status,
        criadoEm: profiles.criadoEm,
      })
      .from(profiles)
      .where(where)
      .orderBy(desc(profiles.criadoEm))
      .limit(PAGE_SIZE)
      .offset(offsetDaPagina(page)),
  ]);

  return { itens, page, pageCount: totalPaginas(total) };
}

const novoUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto.").max(120),
  email: z.string().trim().email("E-mail inválido."),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
  tipo: z.enum(TIPOS),
});

export type NovoUsuarioInput = z.input<typeof novoUsuarioSchema>;

/** Cria um usuário manualmente (já confirmado, via service_role). */
export async function criarUsuario(input: NovoUsuarioInput): Promise<ResultadoAcao> {
  await requireAdmin();

  const parsed = novoUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, email, senha, tipo } = parsed.data;

  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  if (!url || !serviceKey) return { ok: false, erro: "Servidor mal configurado." };

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error) {
    const jaExiste = error.status === 422 || /already/i.test(error.message);
    return { ok: false, erro: jaExiste ? "E-mail já cadastrado." : "Não foi possível criar." };
  }

  // O trigger cria o profile como cliente/ativo; ajusta o tipo se for admin.
  if (tipo === "admin" && data.user) {
    await db.update(profiles).set({ tipo: "admin" }).where(eq(profiles.id, data.user.id));
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

const usuarioSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto.").max(120),
  email: z.string().trim().email("E-mail inválido."),
  telefone: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v || null)
    .nullable(),
  tipo: z.enum(TIPOS),
  status: z.enum(STATUS),
});

export type UsuarioInput = z.input<typeof usuarioSchema>;

export async function atualizarUsuario(id: string, input: UsuarioInput): Promise<ResultadoAcao> {
  const admin = await requireAdmin();

  const parsed = usuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, email, telefone, tipo, status } = parsed.data;

  // Evita o admin se trancar para fora tirando o próprio acesso.
  if (id === admin.id && (tipo !== "admin" || status !== "ativo")) {
    return { ok: false, erro: "Você não pode remover o próprio acesso de admin." };
  }

  const [atual] = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.id, id));
  if (!atual) return { ok: false, erro: "Usuário não encontrado." };

  // E-mail vive no Auth; sincroniza lá antes de refletir no profile.
  const emailMudou = email.toLowerCase() !== atual.email.toLowerCase();
  if (emailMudou) {
    const url = getSupabaseUrl();
    const serviceKey = getServiceRoleKey();
    if (!url || !serviceKey) return { ok: false, erro: "Servidor mal configurado." };

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.auth.admin.updateUserById(id, { email, email_confirm: true });
    if (error) {
      const jaExiste = error.status === 422 || /already|registered/i.test(error.message);
      return { ok: false, erro: jaExiste ? "E-mail já cadastrado." : "Não foi possível salvar o e-mail." };
    }
  }

  await db
    .update(profiles)
    .set({ nome, email, telefone, tipo, status, atualizadoEm: new Date() })
    .where(eq(profiles.id, id));

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/**
 * Exclui um usuário. Bloqueia se ele for o próprio admin ou tiver pedidos
 * vinculados (a FK é `restrict` para preservar o histórico de vendas — nesse
 * caso o admin deve inativar). Remove o usuário no Auth; o profile cai por
 * cascata (`profiles.id -> auth.users ON DELETE CASCADE`).
 */
export async function excluirUsuario(id: string): Promise<ResultadoAcao> {
  const admin = await requireAdmin();

  if (id === admin.id) {
    return { ok: false, erro: "Você não pode excluir a própria conta." };
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(pedidos)
    .where(eq(pedidos.clienteId, id));
  if (total > 0) {
    return {
      ok: false,
      erro: `Usuário tem ${total} pedido(s). Inative em vez de excluir para preservar o histórico.`,
    };
  }

  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  if (!url || !serviceKey) return { ok: false, erro: "Servidor mal configurado." };

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return { ok: false, erro: "Não foi possível excluir." };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
