import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma connection string válida"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Lê e valida as variáveis de ambiente de forma preguiçosa (só na primeira chamada,
 * em runtime). Isso evita quebrar o `next build`, que não precisa conectar no banco.
 * Aceita os nomes da integração Supabase↔Vercel como fallback.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHED_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    console.error(
      "❌ Variáveis de ambiente inválidas:",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
    );
    throw new Error("Configuração de ambiente inválida. Cheque as variáveis de ambiente.");
  }

  cached = parsed.data;
  return cached;
}
