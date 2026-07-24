"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { temaConfig } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { FONTES_CORPO, FONTES_TITULO } from "@/lib/fontes";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida: use o formato #RRGGBB.");

/** As chaves aceitas saem do próprio catálogo - fonte fora dele é recusada. */
function chavesDe(opcoes: readonly { chave: string }[]): [string, ...string[]] {
  return opcoes.map((f) => f.chave) as [string, ...string[]];
}

const temaSchema = z.object({
  escopo: z.enum(["vitrine", "admin"]),
  tema: z.enum(["claro", "escuro", "personalizado"]),
  // As cores viajam mesmo fora do modo personalizado: assim o lojista pode
  // passear por claro e escuro sem perder a paleta que montou.
  cores: z.object({
    bg: hex,
    surface: hex,
    ink: hex,
    line: hex,
    brand: hex,
  }),
  fonteCorpo: z.enum(chavesDe(FONTES_CORPO)),
  fonteTitulo: z.enum(chavesDe(FONTES_TITULO)),
});

export type TemaConfigInput = z.input<typeof temaSchema>;

export async function salvarTemaConfig(input: TemaConfigInput): Promise<ResultadoAcao> {
  await requireAdmin();

  const parsed = temaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { escopo, tema, cores, fonteCorpo, fonteTitulo } = parsed.data;

  const valores = {
    escopo,
    tema,
    corBg: cores.bg,
    corSurface: cores.surface,
    corInk: cores.ink,
    corLine: cores.line,
    corBrand: cores.brand,
    fonteCorpo,
    fonteTitulo,
    atualizadoEm: new Date(),
  };

  await db
    .insert(temaConfig)
    .values(valores)
    .onConflictDoUpdate({ target: temaConfig.escopo, set: valores });

  // O tema é injetado pelo layout de cada escopo, então o que precisa cair é a
  // árvore inteira - não só a tela de Aparência.
  revalidatePath("/", "layout");
  return { ok: true };
}
