"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { pagamentoConfig, type PagamentoConfig } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

export async function obterPagamentoConfig(): Promise<PagamentoConfig | null> {
  await requireAdmin();
  const [row] = await db
    .select()
    .from(pagamentoConfig)
    .orderBy(asc(pagamentoConfig.atualizadoEm))
    .limit(1);
  return row ?? null;
}

const configSchema = z.object({
  accessToken: z.string().trim().max(500).nullable().default(null),
  publicKey: z.string().trim().max(500).nullable().default(null),
  webhookSecret: z.string().trim().max(500).nullable().default(null),
  siteUrl: z
    .string()
    .trim()
    .url("URL do site inválida.")
    .max(300)
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  taxaGateway: z
    .number()
    .min(0, "Taxa não pode ser negativa.")
    .max(100, "Taxa não pode passar de 100%."),
  ativo: z.boolean().default(false),
});

export type PagamentoConfigInput = z.input<typeof configSchema>;

export async function salvarPagamentoConfig(input: PagamentoConfigInput): Promise<ResultadoAcao> {
  await requireAdmin();

  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = { ...parsed.data, taxaGateway: parsed.data.taxaGateway.toFixed(2) };

  const [existente] = await db
    .select({ id: pagamentoConfig.id })
    .from(pagamentoConfig)
    .orderBy(asc(pagamentoConfig.atualizadoEm))
    .limit(1);

  if (existente) {
    await db
      .update(pagamentoConfig)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(pagamentoConfig.id, existente.id));
  } else {
    await db.insert(pagamentoConfig).values(dados);
  }

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/produtos");
  return { ok: true };
}
