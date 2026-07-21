import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

// Singleton para não esgotar o pool no hot-reload do dev.
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

let dbInstance: DB | null = null;

function getDb(): DB {
  if (dbInstance) return dbInstance;
  // prepare:false é necessário com a Transaction Pooler do Supabase.
  const client = globalForDb.__pgClient ?? postgres(getEnv().DATABASE_URL, { prepare: false });
  if (process.env.NODE_ENV !== "production") globalForDb.__pgClient = client;
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

// Proxy lazy: a conexão/validação só acontece na primeira query (runtime),
// nunca ao importar o módulo (build).
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
