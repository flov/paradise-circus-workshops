# Paradise Circus Workshops

A full-stack workshop booking and community platform for a flow arts community in Pai, Thailand.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Database:** PostgreSQL (Neon serverless) via Drizzle ORM
- **Auth:** Clerk
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Email:** Resend + React Email
- **Error tracking:** Sentry
- **Package manager:** pnpm

## Commands

```bash
pnpm test             # Run Vitest unit tests (uses .env.test)
npx drizzle-kit generate --name migration-name # to create a new migration after changing the schema

```

# Development Notes

always run pnpm instead of npm to ensure the correct package manager is used.
always run npx drizzle-kit generate --name migration-name to create a new migration after changing the schema, then run pnpm run db:migrate to apply it.
