/**
 * Run migrations against the local test database.
 * Use after starting the test Postgres container with pnpm test:db:up.
 *
 * Usage: pnpm test:db:migrate
 *
 * Requires DATABASE_URL_TEST pointing to local Postgres (e.g. postgresql://postgres:postgres@localhost:5433/paradise_circus_test)
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.test") });

const databaseUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5433/paradise_circus_test";

// Must be a standard Postgres URL (localhost) - Neon serverless driver won't work
if (!databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
  console.error(
    "ERROR: test-db-setup is for local Postgres only. DATABASE_URL_TEST should point to localhost.",
  );
  process.exit(1);
}

async function run() {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  const urlSafe = databaseUrl.replace(/:[^:@]+@/, ":****@");
  console.log("Migrating test database:", urlSafe);

  await migrate(db, {
    migrationsFolder: resolve(process.cwd(), "drizzle"),
  });

  await pool.end();
  console.log("Migrations completed successfully.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
