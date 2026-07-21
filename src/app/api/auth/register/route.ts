import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

export const runtime = "nodejs";

const bodySchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto."),
  email: z.string().trim().email("Email inválido."),
  telefone: z.string().trim().optional(),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { nome, email, telefone, senha } = parsed.data;
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Servidor mal configurado." }, { status: 500 });
  }

  // Usa a service_role para criar já confirmado (evita depender de SMTP no free tier).
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, telefone: telefone || null },
  });

  if (error) {
    const jaExiste = error.status === 422 || /already/i.test(error.message);
    return NextResponse.json(
      { error: jaExiste ? "Email já cadastrado." : "Não foi possível registrar." },
      { status: jaExiste ? 409 : 400 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
