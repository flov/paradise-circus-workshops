/**
 * Run Drizzle migrations using the Neon HTTP driver (same connection as the app).
 * Use this when drizzle-kit migrate fails (e.g. env loading or Neon connection issues).
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

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL is not set. Check .env or .env.local");
  process.exit(1);
}

// Log which DB we're connecting to (hide password)
const urlSafe = databaseUrl.replace(/:[^:@]+@/, ":****@");
console.log("Migrating database:", urlSafe);

async function run() {
  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  await migrate(db, {
    migrationsFolder: resolve(process.cwd(), "drizzle"),
  });
  console.log("Migrations completed successfully.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
