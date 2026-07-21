"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categorias, produtos, type Categoria } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugUnico } from "@/lib/slug";

const categoriaSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto."),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});

export type CategoriaInput = z.input<typeof categoriaSchema>;

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

export async function listarCategorias(): Promise<Categoria[]> {
  await requireAdmin();
  return db.select().from(categorias).orderBy(asc(categorias.ordem), asc(categorias.nome));
}

/** Slugs em uso, exceto o da categoria em edição. */
async function slugsEmUso(idIgnorado?: string): Promise<string[]> {
  const linhas = await db
    .select({ slug: categorias.slug })
    .from(categorias)
    .where(idIgnorado ? ne(categorias.id, idIgnorado) : undefined);
  return linhas.map((l) => l.slug);
}

export async function salvarCategoria(
  id: string | null,
  input: CategoriaInput,
): Promise<ResultadoAcao> {
  await requireAdmin();

  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, ordem, ativo } = parsed.data;

  const slug = slugUnico(nome, await slugsEmUso(id ?? undefined));
  const valores = { nome, slug, ordem, ativo };

  if (id) {
    await db.update(categorias).set(valores).where(eq(categorias.id, id));
  } else {
    await db.insert(categorias).values(valores);
  }

  revalidatePath("/admin/categorias");
  return { ok: true };
}

/**
 * A FK de produtos usa ON DELETE RESTRICT, então uma categoria com produtos
 * não pode sumir. Checar antes permite devolver mensagem em vez de erro do banco.
 */
export async function excluirCategoria(id: string): Promise<ResultadoAcao> {
  await requireAdmin();

  const emUso = await db
    .select({ id: produtos.id })
    .from(produtos)
    .where(eq(produtos.categoriaId, id))
    .limit(1);

  if (emUso.length > 0) {
    return { ok: false, erro: "Categoria com produtos. Mova os produtos antes de excluir." };
  }

  await db.delete(categorias).where(eq(categorias.id, id));
  revalidatePath("/admin/categorias");
  return { ok: true };
}
