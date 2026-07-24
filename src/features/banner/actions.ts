"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { banners, type Banner } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { removerImagem, uploadImagem } from "@/lib/storage";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

export async function listarBanners(): Promise<Banner[]> {
  await requireAdmin();
  return db.select().from(banners).orderBy(asc(banners.ordem), asc(banners.criadoEm));
}

const bannerSchema = z.object({
  imagemUrl: z.string().url("Envie a imagem do banner."),
  imagemMobileUrl: z.string().url().nullable().default(null),
  link: z.string().trim().max(500).nullable().default(null),
  alt: z.string().trim().max(200).nullable().default(null),
  ativo: z.boolean().default(true),
});

export type BannerInput = z.input<typeof bannerSchema>;

export async function salvarBanner(id: string | null, input: BannerInput): Promise<ResultadoAcao> {
  await requireAdmin();

  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  if (id) {
    // Imagens trocadas saem do bucket para não virar lixo.
    const [anterior] = await db.select().from(banners).where(eq(banners.id, id));
    if (anterior) {
      if (anterior.imagemUrl !== dados.imagemUrl) await removerImagem(anterior.imagemUrl);
      if (anterior.imagemMobileUrl && anterior.imagemMobileUrl !== dados.imagemMobileUrl) {
        await removerImagem(anterior.imagemMobileUrl);
      }
    }
    await db.update(banners).set(dados).where(eq(banners.id, id));
  } else {
    // Nasce no fim da fila.
    const total = await db.$count(banners);
    await db.insert(banners).values({ ...dados, ordem: total });
  }

  revalidatePath("/admin/banner");
  revalidatePath("/");
  return { ok: true };
}

export async function excluirBanner(id: string): Promise<ResultadoAcao> {
  await requireAdmin();

  const [banner] = await db.select().from(banners).where(eq(banners.id, id));
  await db.delete(banners).where(eq(banners.id, id));

  if (banner) {
    await removerImagem(banner.imagemUrl);
    if (banner.imagemMobileUrl) await removerImagem(banner.imagemMobileUrl);
  }

  revalidatePath("/admin/banner");
  revalidatePath("/");
  return { ok: true };
}

/** Reordena aplicando a nova sequência de ids. */
export async function reordenarBanners(ids: string[]): Promise<ResultadoAcao> {
  await requireAdmin();
  await db.transaction(async (tx) => {
    for (const [ordem, id] of ids.entries()) {
      await tx.update(banners).set({ ordem }).where(eq(banners.id, id));
    }
  });
  revalidatePath("/admin/banner");
  revalidatePath("/");
  return { ok: true };
}

export async function enviarBanner(formData: FormData): Promise<{ url?: string; erro?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { erro: "Arquivo inválido." };
  try {
    return { url: await uploadImagem(file, "banners") };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha no upload." };
  }
}
