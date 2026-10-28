/**
 * Run Drizzle migrations using node-postgres (same connection style as the app).
 *
 * Usage: pnpm tsx scripts/migrate.ts
 *
 * Loads .env and .env.local (same as Next.js) so DATABASE_URL matches the dev server.
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load .env first, then .env.local (overrides) - matches Next.js loading order
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL is not set. Check .env or .env.local");
  process.exit(1);
}

// Prefer direct connection for migrations when a pooler URL is configured
const migrateUrl = databaseUrl.includes("pooler.supabase.com")
  ? databaseUrl
      .replace("postgres.dbpzfqmbgxbetmvbchag", "postgres")
      .replace(/@[^/]*pooler\.supabase\.com:\d+/, "@db.dbpzfqmbgxbetmvbchag.supabase.co:5432")
  : databaseUrl;

// Log which DB we're connecting to (hide password)
const urlSafe = migrateUrl.replace(/:[^:@]+@/, ":****@");
console.log("Migrating database:", urlSafe);

function stripSslMode(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  } catch {
    return url;
  }
}

async function run() {
  const pool = new Pool({
    connectionString: stripSslMode(migrateUrl),
    ssl: migrateUrl.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  try {
    await migrate(db, {
      migrationsFolder: resolve(process.cwd(), "drizzle"),
    });
    console.log("Migrations completed successfully.");
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
