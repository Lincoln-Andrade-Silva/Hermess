"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { lojaInfo, type LojaInfo } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { removerImagem, uploadImagem } from "@/lib/storage";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

export async function obterConfiguracoes(): Promise<LojaInfo | null> {
  await requireAdmin();
  const [info] = await db.select().from(lojaInfo).orderBy(asc(lojaInfo.atualizadoEm)).limit(1);
  return info ?? null;
}

const configSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da loja.").max(60, "Nome muito longo."),
  logoUrl: z.string().url().nullable().default(null),
  telefone: z.string().trim().max(30).nullable().default(null),
  endereco: z.string().trim().max(300).nullable().default(null),
  instagram: z.string().trim().max(100).nullable().default(null),
});

export type ConfiguracoesInput = z.input<typeof configSchema>;

export async function salvarConfiguracoes(input: ConfiguracoesInput): Promise<ResultadoAcao> {
  await requireAdmin();

  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  const [existente] = await db.select().from(lojaInfo).orderBy(asc(lojaInfo.atualizadoEm)).limit(1);

  if (existente) {
    // Logo trocada sai do bucket para não virar lixo.
    if (existente.logoUrl && existente.logoUrl !== dados.logoUrl) {
      await removerImagem(existente.logoUrl);
    }
    await db
      .update(lojaInfo)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(lojaInfo.id, existente.id));
  } else {
    await db.insert(lojaInfo).values(dados);
  }

  // Marca aparece em toda a UI: revalida a raiz inteira.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function enviarLogo(formData: FormData): Promise<{ url?: string; erro?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { erro: "Arquivo inválido." };
  try {
    return { url: await uploadImagem(file, "loja") };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha no upload." };
  }
}
