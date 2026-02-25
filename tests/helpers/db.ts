import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";

type TestDb = ReturnType<typeof createTestDb>;
let testDb: TestDb | null = null;

function createTestDb() {
  const databaseUrl =
    process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_TEST must be set for tests");
  }
  const isLocalPostgres =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  if (isLocalPostgres) {
    const { Pool } = require("pg");
    const { drizzle } = require("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: databaseUrl });
    return drizzle(pool, { schema });
  }
  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  const sqlClient = neon(databaseUrl);
  return drizzle(sqlClient, { schema });
}

export function getTestDb() {
  if (!testDb) {
    testDb = createTestDb();
  }
  return testDb;
}

/**
 * Clean up all test data from the database
 * Uses a single batched TRUNCATE to minimize round-trips
 */
export async function cleanupDatabase() {
  const db = getTestDb();

  try {
    await db.execute(sql`
      TRUNCATE TABLE
        participations, comments, user_props, events,
        users, props, activity_logs
      CASCADE
    `);
  } catch (error) {
    // If tables don't exist or other error, try deleting all rows
    console.warn("Error truncating tables, trying delete instead:", error);
    try {
      await db.delete(schema.participations);
      await db.delete(schema.comments);
      await db.delete(schema.userProps);
      await db.delete(schema.activityLogs);
      await db.delete(schema.events);
      await db.delete(schema.users);
      await db.delete(schema.props);
    } catch (deleteError) {
      // Ignore errors during cleanup - tables might be empty or not exist
      console.warn(
        "Error deleting test data (this is usually fine):",
        deleteError,
      );
    }
  }
}

/**
 * Seed test data helpers
 */
export async function createTestUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
) {
  const db = getTestDb();
  const [user] = await db
    .insert(schema.users)
    .values({
      clerkUserId: `test-clerk-${Date.now()}-${Math.random()}`,
      username: `testuser-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      displayName: "Test User",
      isAdmin: false,
      isInstructor: false,
      ...overrides,
    })
    .returning();
  return user;
}

export async function createTestEvent(
  overrides: Partial<typeof schema.events.$inferInsert> = {},
) {
  const db = getTestDb();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [event] = await db
    .insert(schema.events)
    .values({
      title: "Test Event",
      description: "Test Description",
      instructor: "Test Instructor",
      date: tomorrow.toISOString().split("T")[0],
      startTime: "10:00:00",
      endTime: "12:00:00",
      location: "Test Location",
      maxCapacity: 20,
      currentParticipants: 0,
      isWorkshop: true,
      isPublished: true,
      isRecurring: false,
      ...overrides,
    })
    .returning();
  return event;
}

export async function createTestParticipation(
  eventId: number,
  overrides: Partial<typeof schema.participations.$inferInsert> = {},
) {
  const db = getTestDb();
  const { randomUUID } = await import("crypto");

  const [participation] = await db
    .insert(schema.participations)
    .values({
      eventId,
      clerkUserId: `test-clerk-${Date.now()}`,
      participantName: "Test Participant",
      participantEmail: `participant-${Date.now()}@example.com`,
      confirmationToken: randomUUID(),
      ...overrides,
    })
    .returning();

  // Update event participant count
  await db
    .update(schema.events)
    .set({ currentParticipants: sql`${schema.events.currentParticipants} + 1` })
    .where(sql`${schema.events.id} = ${eventId}`);

  return participation;
}

export async function createTestComment(
  eventId: number,
  clerkUserId: string,
  overrides: Partial<typeof schema.comments.$inferInsert> = {},
) {
  const db = getTestDb();

  const [comment] = await db
    .insert(schema.comments)
    .values({
      eventId,
      clerkUserId,
      authorName: "Test Author",
      content: "Test comment content",
      ...overrides,
    })
    .returning();

  return comment;
}
