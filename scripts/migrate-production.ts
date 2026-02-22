/**
 * Run Drizzle migrations against the PRODUCTION database.
 * Loads ONLY .env.production - does NOT load .env.local (which would override with dev DB).
 *
 * Usage: pnpm run db:migrate:production
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.production") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL is not set. Check .env.production");
  process.exit(1);
}

// Log which DB we're connecting to (hide password, show host for verification)
const urlSafe = databaseUrl.replace(/:[^:@]+@/, ":****@");
let hostInfo = "";
try {
  const urlObj = new URL(databaseUrl.replace(/^postgresql/, "https"));
  hostInfo = ` | Host: ${urlObj.hostname}`;
} catch {
  // ignore parse errors
}
console.log("Migrating PRODUCTION database:", urlSafe + hostInfo);

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
