"use server";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { offsetDaPagina, PAGE_SIZE, parsePagina, totalPaginas } from "@/lib/pagination";

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

const usuarioSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto.").max(120),
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
  const dados = parsed.data;

  // Evita o admin se trancar para fora tirando o próprio acesso.
  if (id === admin.id && (dados.tipo !== "admin" || dados.status !== "ativo")) {
    return { ok: false, erro: "Você não pode remover o próprio acesso de admin." };
  }

  await db
    .update(profiles)
    .set({ ...dados, atualizadoEm: new Date() })
    .where(eq(profiles.id, id));

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
