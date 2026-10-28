import * as schema from "./schema";
import { Pool, type PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const databaseUrl = process.env.DATABASE_URL;
const isLocalPostgres =
  databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

declare global {
  // eslint-disable-next-line no-var
  var __paradiseCircusPgPool: Pool | undefined;
}

// pg v8 treats sslmode=require as verify-full; strip it and set ssl explicitly
function connectionStringForPool(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  } catch {
    return url;
  }
}

const poolConfig: PoolConfig = {
  connectionString: connectionStringForPool(databaseUrl),
  // Transaction pooler (Supabase :6543) works well with a small pool per instance
  max: isLocalPostgres ? 10 : 3,
};

if (!isLocalPostgres) {
  // Supabase / cloud Postgres present a cert chain Node's default CA set rejects
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = globalThis.__paradiseCircusPgPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalThis.__paradiseCircusPgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
