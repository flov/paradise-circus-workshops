/**
 * Record Drizzle migrations as already applied without running SQL.
 *
 * Use when the database schema was applied outside `pnpm db:migrate`
 * (e.g. Supabase bundled SQL), so `drizzle.__drizzle_migrations` is empty
 * but tables already exist.
 *
 * Usage:
 *   pnpm tsx scripts/baseline-drizzle-migrations.ts 0033_remove-skill-level
 *
 * Then run `pnpm db:migrate` to apply any newer migrations only.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const tag = process.argv[2];
if (!tag) {
  console.error(
    "Usage: pnpm tsx scripts/baseline-drizzle-migrations.ts <journal-tag>",
  );
  console.error("Example: pnpm tsx scripts/baseline-drizzle-migrations.ts 0033_remove-skill-level");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const migrationsFolder = resolve(process.cwd(), "drizzle");
const journal = JSON.parse(
  readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8"),
) as {
  entries: { tag: string; when: number }[];
};

const entry = journal.entries.find((e) => e.tag === tag);
if (!entry) {
  console.error(`No journal entry with tag "${tag}".`);
  process.exit(1);
}

const sqlPath = `${migrationsFolder}/${entry.tag}.sql`;
const query = readFileSync(sqlPath, "utf8");
const hash = createHash("sha256").update(query).digest("hex");

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
    connectionString: stripSslMode(databaseUrl),
    ssl: databaseUrl.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });

  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const existing = await pool.query<{ created_at: string }>(
      `SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1`,
    );
    const lastWhen = existing.rows[0]
      ? Number(existing.rows[0].created_at)
      : null;

    if (lastWhen !== null && lastWhen >= entry.when) {
      console.log(
        `Already baselined at created_at ${lastWhen} (>= ${entry.when} for ${tag}). Nothing to do.`,
      );
      return;
    }

    await pool.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
      [hash, entry.when],
    );
    console.log(`Baselined Drizzle at ${tag} (created_at=${entry.when}).`);
    console.log("Run pnpm db:migrate to apply any newer migrations.");
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
