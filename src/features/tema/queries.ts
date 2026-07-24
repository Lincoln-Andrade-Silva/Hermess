import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { temaConfig, type TemaConfig } from "@/db/schema";
import type { EscopoTema } from "@/lib/tema";

/**
 * Tema de um escopo, ou `null` quando ainda não foi configurado. Leitura
 * pública: a vitrine e o login renderizam com ela antes de existir sessão.
 *
 * Em cache por requisição porque o layout consulta duas vezes - uma para as CSS
 * vars e outra para o `theme-color` do viewport.
 */
export const obterTemaConfig = cache(
  async (escopo: EscopoTema): Promise<TemaConfig | null> => {
    const [config] = await db
      .select()
      .from(temaConfig)
      .where(eq(temaConfig.escopo, escopo))
      .limit(1);
    return config ?? null;
  },
);
