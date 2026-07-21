import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Profile do usuário autenticado, ou null quando não há sessão válida. */
export async function getProfileOpcional(): Promise<Profile | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id));
  if (!profile || profile.status !== "ativo") return null;

  return profile;
}

/**
 * Exige um usuário autenticado. Redireciona para /login se não houver sessão
 * válida ou se o profile não existir. Use em Server Components/Layouts fechados.
 */
export async function getCurrentProfile(): Promise<Profile> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id));
  if (!profile) redirect("/login");
  if (profile.status !== "ativo") redirect("/login?erro=inativo");

  return profile;
}

/** Exige um usuário admin. Redireciona clientes para a home. Use em rotas/ações admin. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (profile.tipo !== "admin") redirect("/");
  return profile;
}
