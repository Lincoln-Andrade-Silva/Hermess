import { headers } from "next/headers";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { pagamentoConfig, type PagamentoConfig } from "@/db/schema";

/** Config do gateway (linha única). Server-only — nunca expor o access_token no client. */
export async function getPagamentoConfig(): Promise<PagamentoConfig | null> {
  const [row] = await db
    .select()
    .from(pagamentoConfig)
    .orderBy(asc(pagamentoConfig.atualizadoEm))
    .limit(1);
  return row ?? null;
}

/** Percentual retido pelo gateway por venda. 0 quando não configurado. */
export async function getTaxaGateway(): Promise<number> {
  const cfg = await getPagamentoConfig();
  return cfg ? Number(cfg.taxaGateway) : 0;
}

/** URL pública base usada em checkout/webhook. Config > env > headers da requisição. */
export async function getBaseUrl(): Promise<string> {
  const cfg = await getPagamentoConfig();
  if (cfg?.siteUrl) return cfg.siteUrl.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
