import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local to match Next.js dev server (overrides .env)
config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

