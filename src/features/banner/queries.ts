import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { banners, type Banner } from "@/db/schema";

/** Banners ativos da home, na ordem definida no admin. Leitura pública. */
export async function listarBannersAtivos(): Promise<Banner[]> {
  return db
    .select()
    .from(banners)
    .where(eq(banners.ativo, true))
    .orderBy(asc(banners.ordem), asc(banners.criadoEm));
}
