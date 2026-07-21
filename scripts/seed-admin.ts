import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const ADMIN_EMAIL = "admin@hermess.com";
const ADMIN_PASSWORD = "123456";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  if (!supabaseUrl || !serviceKey || !databaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e DATABASE_URL são obrigatórias.",
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existente = list.users.find((u) => u.email === ADMIN_EMAIL);
  let userId: string;

  if (existente) {
    userId = existente.id;
    console.log(`Admin já existe: ${ADMIN_EMAIL}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { nome: "Administrador" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Admin criado: ${ADMIN_EMAIL}`);
  }

  // O trigger cria o profile como 'cliente'; garante que o seed seja admin/ativo.
  const sql = postgres(databaseUrl, { prepare: false, max: 1 });
  try {
    await sql`update public.profiles set tipo = 'admin', status = 'ativo' where id = ${userId}`;
  } finally {
    await sql.end();
  }

  console.log("✅ Seed do admin concluído.");
  console.log(`   Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error("❌ Seed falhou:");
  console.error(err);
  process.exit(1);
});
