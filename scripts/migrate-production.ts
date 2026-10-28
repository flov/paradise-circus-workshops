/**
 * Run Drizzle migrations against the PRODUCTION database.
 * Loads ONLY .env.production - does NOT load .env.local (which would override with dev DB).
 *
 * Usage: pnpm run db:migrate:production
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.production") });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL is not set. Check .env.production");
  process.exit(1);
}

// Prefer direct connection for migrations when a pooler URL is configured
const migrateUrl = databaseUrl.includes("pooler.supabase.com")
  ? databaseUrl
      .replace("postgres.dbpzfqmbgxbetmvbchag", "postgres")
      .replace(/@[^/]*pooler\.supabase\.com:\d+/, "@db.dbpzfqmbgxbetmvbchag.supabase.co:5432")
  : databaseUrl;

// Log which DB we're connecting to (hide password, show host for verification)
const urlSafe = migrateUrl.replace(/:[^:@]+@/, ":****@");
let hostInfo = "";
try {
  const urlObj = new URL(migrateUrl.replace(/^postgresql/, "https"));
  hostInfo = ` | Host: ${urlObj.hostname}`;
} catch {
  // ignore parse errors
}
console.log("Migrating PRODUCTION database:", urlSafe + hostInfo);

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
