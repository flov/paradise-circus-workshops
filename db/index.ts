import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const databaseUrl = process.env.DATABASE_URL;
const isLocalPostgres =
  databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

let db: ReturnType<typeof import("drizzle-orm/neon-http").drizzle>;

if (isLocalPostgres) {
  const { Pool } = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: databaseUrl });
  db = drizzle(pool, { schema });
} else {
  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });
}

export { db };
export { schema };
