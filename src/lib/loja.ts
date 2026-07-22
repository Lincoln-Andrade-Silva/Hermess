import { asc } from "drizzle-orm";
import { db } from "@/db";
import { lojaInfo, type LojaInfo } from "@/db/schema";

export const NOME_PADRAO = "Hermess";

export interface LojaBrand {
  nome: string;
  logoUrl: string | null;
}

/**
 * Registro único de configuração da loja, ou `null` quando ainda não foi
 * cadastrado. Toda a UI que exibe identidade deriva daqui.
 */
export async function getLojaInfo(): Promise<LojaInfo | null> {
  const [info] = await db.select().from(lojaInfo).orderBy(asc(lojaInfo.atualizadoEm)).limit(1);
  return info ?? null;
}

/**
 * Identidade exibida no login, no painel e na vitrine. Sem registro ou nome
 * vazio, cai no padrão do template — nada quebra num deploy recém-criado.
 */
export async function getLojaBrand(): Promise<LojaBrand> {
  const info = await getLojaInfo();
  const nome = info?.nome.trim();
  return { nome: nome || NOME_PADRAO, logoUrl: info?.logoUrl ?? null };
}
