import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida. Cheque o arquivo .env.");
  }

  const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 5 });
  try {
    const [row] = await sql<{ version: string }[]>`select version()`;
    console.log("✅ Conexão OK com o Postgres do Supabase.");
    console.log("   " + row.version);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌ Falha ao conectar no banco:");
  console.error(err);
  process.exit(1);
});
