# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paradise Circus is a workshop booking and community platform for flow artists in Pai, Thailand. It consists of a Next.js 16 web app (`/web`) and an Expo React Native mobile app (`/mobile`, MVP stage).

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Database:** PostgreSQL (Neon serverless) via Drizzle ORM
- **Auth:** Clerk (`@clerk/nextjs`, `@clerk/clerk-expo` for mobile)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix UI components)
- **Email:** Resend + React Email (templates in `emails/`)
- **Data fetching:** TanStack React Query
- **Forms:** React Hook Form + Zod validation
- **Error tracking:** Sentry (server + client)
- **Testing:** Vitest (unit), Playwright (e2e)
- **Package manager:** pnpm (always use pnpm, never npm)

## Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm lint                   # ESLint
pnpm email:dev              # React Email dev server

# Testing
pnpm test                   # Vitest in watch mode (uses .env.test)
pnpm test:run               # Single test run (no watch)
pnpm test:coverage          # Coverage report
# Run a single test file:
pnpm test -- tests/helpers/some-test.ts

# Database
npx drizzle-kit generate --name migration-name   # Generate migration after schema changes
pnpm db:migrate                                    # Apply migrations locally
pnpm db:migrate:production                         # Apply migrations to production

# Build
pnpm build                  # Production build
```

## Architecture

### App Structure (Next.js App Router)

- **Server Actions** in `app/actions.ts`, `app/admin/actions.ts`, `app/profile/actions.ts` — contain all data mutations (creating events, managing bookings, admin operations)
- **API routes** in `app/api/` — REST endpoints for mobile app consumption and webhooks (Clerk webhook at `api/webhooks/clerk/`)
- **Pages** are server components by default; client interactivity is in separate `components/`

### Database (`db/schema.ts`)

Single schema file defines all tables with Drizzle ORM. Core tables:

- `events` — workshops/classes with capacity, scheduling, recurring support
- `participations` — bookings linked to events (cascade delete)
- `users` — synced from Clerk via webhook, contains profile data (bio, props, instructor/admin flags)
- `props` — flow art prop catalog; `user_props` tracks skill levels
- `comments` — event comments linked to Clerk users
- `activity_logs` — audit trail for admin actions

After changing `db/schema.ts`, always generate a migration with `npx drizzle-kit generate --name <name>` then apply with `pnpm db:migrate`.

### Key Patterns

- **Path alias:** `@/*` maps to the project root (e.g., `@/db/schema`, `@/lib/utils`)
- **Event slugs:** Events are referenced by URL slug (format: `{id}-{slugified-title}`) in public routes like `/event/[slug]` and `/book/[slug]`
- **Auth flow:** Clerk handles auth → webhook syncs user to DB → `users` table has `clerkUserId` foreign key pattern
- **Recurring events:** Events can belong to a `recurringSeriesId` group with `isRecurring` and `recurringUntil` fields
- **Activity logging:** Admin and instructor actions are logged via `lib/activity-log.ts` with types defined in `lib/activity-config.ts`

### Mobile App (`/mobile`)

Expo React Native app using expo-router. Shares the same Clerk auth and consumes the web app's API routes (`/api/artists`, `/api/timetable/public`). Currently in MVP scaffolding phase.
