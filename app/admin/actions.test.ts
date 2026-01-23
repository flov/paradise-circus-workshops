import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createEvent,
  approveEvent,
  updateEvent,
  deleteEvent,
  deleteBooking,
  extendRecurringEvents,
} from "./actions";
import {
  cleanupDatabase,
  createTestUser,
  createTestEvent,
  createTestParticipation,
  getTestDb,
} from "@/tests/helpers/db";
import {
  resetAuthMocks,
  mockAdminAuth,
  mockInstructorAuth,
  mockRegularUserAuth,
  mockUnauthenticated,
  mockCurrentUserData,
  createMockUser,
} from "@/tests/helpers/auth";
import {
  resetEmailMocks,
  wasEmailSent,
  getSentEmails,
} from "@/tests/helpers/email";
import {
  createEventFormData,
  createEventUpdateFormData,
} from "@/tests/helpers/form-data";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { events, participations } from "@/db/schema";
import { randomUUID } from "crypto";
import { isAdmin, isInstructor, getAllAdmins } from "@/app/profile/actions";

vi.mock("next/cache");

describe("extendRecurringEvents", () => {
  beforeEach(async () => {
    await cleanupDatabase();
    resetAuthMocks();
    resetEmailMocks();
    vi.clearAllMocks();
  });

  it("should create events for series that need extension", async () => {
    const seriesId = randomUUID();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Use a date further in the past to ensure we create enough events
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Create a recurring event that ends a week ago (needs extension)
    await createTestEvent({
      title: "Recurring Event",
      date: weekAgo.toISOString().split("T")[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    });

    const result = await extendRecurringEvents();

    expect(result.success).toBe(true);
    expect(result.eventsCreated).toBeGreaterThan(0);
    expect(result.seriesProcessed).toBe(1);

    const db = getTestDb();
    const extendedEvents = await db
      .select()
      .from(events)
      .where(eq(events.recurringSeriesId, seriesId))
      .orderBy(events.date);

    // Should have created events - verify we have more than just the original event
    expect(extendedEvents.length).toBeGreaterThan(1);
    
    // Verify the latest event date is in the future (at least today or later)
    const latestDate = new Date(extendedEvents[extendedEvents.length - 1].date);
    latestDate.setHours(0, 0, 0, 0);
    const todayNormalized = new Date(today);
    todayNormalized.setHours(0, 0, 0, 0);
    
    // The latest date should be today or in the future
    expect(latestDate.getTime()).toBeGreaterThanOrEqual(todayNormalized.getTime());
    
    // Verify events were created extending into the future
    // The original event was weekAgo, so we should have events at least up to today
    const originalEventDate = new Date(weekAgo);
    originalEventDate.setHours(0, 0, 0, 0);
    expect(latestDate.getTime()).toBeGreaterThan(originalEventDate.getTime());
  });

  it("should skip series that already have enough events", async () => {
    const seriesId = randomUUID();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create a recurring event that already extends into next week
    await createTestEvent({
      title: "Recurring Event",
      date: nextWeek.toISOString().split("T")[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    });

    const result = await extendRecurringEvents();

    expect(result.success).toBe(true);
    expect(result.eventsCreated).toBe(0); // No new events needed
    expect(result.seriesProcessed).toBe(1);
  });

  it("should avoid duplicate events", async () => {
    const seriesId = randomUUID();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create event ending yesterday
    await createTestEvent({
      title: "Recurring Event",
      date: yesterday.toISOString().split("T")[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    });

    // Run extension twice
    await extendRecurringEvents();
    const result = await extendRecurringEvents();

    expect(result.success).toBe(true);
    // Second run should not create duplicates
    expect(result.eventsCreated).toBe(0);
  });

  it("should handle multiple recurring series", async () => {
    const seriesId1 = randomUUID();
    const seriesId2 = randomUUID();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTestEvent({
      title: "Series 1",
      date: yesterday.toISOString().split("T")[0],
      recurringSeriesId: seriesId1,
      isRecurring: true,
    });

    await createTestEvent({
      title: "Series 2",
      date: yesterday.toISOString().split("T")[0],
      recurringSeriesId: seriesId2,
      isRecurring: true,
    });

    const result = await extendRecurringEvents();

    expect(result.success).toBe(true);
    expect(result.seriesProcessed).toBe(2);
    expect(result.eventsCreated).toBeGreaterThan(0);
  });

  it("should revalidate paths", async () => {
    const seriesId = randomUUID();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTestEvent({
      date: yesterday.toISOString().split("T")[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    });

    await extendRecurringEvents();

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/api/timetable");
  });

  it("should only extend if latest event still has isRecurring: true", async () => {
    const seriesId = randomUUID();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Use a date further in the past to ensure we create enough events
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create a recurring event series: week ago + next week
    const event1 = await createTestEvent({
      title: "Recurring Event",
      date: weekAgo.toISOString().split("T")[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    });
    const event2 = await createTestEvent({
      title: "Recurring Event",
      date: nextWeek.toISOString().split("T")[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    });

    // Count events before cronjob
    const db = getTestDb();
    const eventsBefore = await db
      .select()
      .from(events)
      .where(eq(events.recurringSeriesId, seriesId));
    expect(eventsBefore.length).toBe(2);

    // Simulate user unchecking recurring on the next week's event
    await db
      .update(events)
      .set({
        isRecurring: false,
        recurringSeriesId: null,
      })
      .where(eq(events.id, event2.id));

    // Verify event2 is no longer recurring
    const event2After = await db
      .select()
      .from(events)
      .where(eq(events.id, event2.id))
      .limit(1);
    expect(event2After).toHaveLength(1);
    expect(event2After[0].isRecurring).toBe(false);
    expect(event2After[0].recurringSeriesId).toBeNull();

    // Run the cronjob
    const result = await extendRecurringEvents();

    expect(result.success).toBe(true);
    expect(result.seriesProcessed).toBe(1);
    expect(result.eventsCreated).toBeGreaterThan(0);

    // Verify that events were created based on event1 (the latest recurring event)
    // The cronjob should only consider events with isRecurring: true
    const allEvents = await db
      .select()
      .from(events)
      .where(eq(events.recurringSeriesId, seriesId))
      .orderBy(events.date);

    // Should have event1 + new events extending from it (event2 is excluded)
    expect(allEvents.length).toBeGreaterThan(1);

    // All events in the series should have isRecurring: true
    expect(allEvents.every((e) => e.isRecurring)).toBe(true);

    // event2 should not be in the series anymore
    expect(allEvents.every((e) => e.id !== event2.id)).toBe(true);

    // The latest event in the series should be based on event1's date, not event2's
    const latestSeriesEvent = allEvents[allEvents.length - 1];
    const latestDate = new Date(latestSeriesEvent.date);
    latestDate.setHours(0, 0, 0, 0);
    const todayNormalized = new Date(today);
    todayNormalized.setHours(0, 0, 0, 0);
    
    // Verify the latest event is in the future (at least today or later)
    expect(latestDate.getTime()).toBeGreaterThanOrEqual(todayNormalized.getTime());
    
    // Verify events were extended from event1's date (weekAgo), not from event2's date (nextWeek)
    const event1Date = new Date(weekAgo);
    event1Date.setHours(0, 0, 0, 0);
    expect(latestDate.getTime()).toBeGreaterThan(event1Date.getTime());

    // Verify the extension started from event1's date, not event2's
    // Since event2 (nextWeek) is no longer recurring, the extension should be based on event1 (weekAgo)
    const firstNewEvent = allEvents.find((e) => e.id !== event1.id);
    expect(firstNewEvent).toBeDefined();
    if (firstNewEvent) {
      const firstNewEventDate = new Date(firstNewEvent.date);
      firstNewEventDate.setHours(0, 0, 0, 0);
      const event1Date = new Date(weekAgo);
      event1Date.setHours(0, 0, 0, 0);
      const event2Date = new Date(nextWeek);
      event2Date.setHours(0, 0, 0, 0);
      
      // The first new event should be after event1's date
      expect(firstNewEventDate.getTime()).toBeGreaterThan(event1Date.getTime());
      
      // The first new event should be before or equal to event2's date
      // This verifies that extension is based on event1 (weekAgo + 7 = today),
      // not event2 (nextWeek), since event2 is no longer part of the recurring series
      expect(firstNewEventDate.getTime()).toBeLessThanOrEqual(event2Date.getTime());
      
      // Additionally, verify it's reasonably close to event1 + 7 days (within 7 days)
      const event1Plus7 = new Date(event1Date);
      event1Plus7.setDate(event1Plus7.getDate() + 7);
      const daysDiff = Math.abs((firstNewEventDate.getTime() - event1Plus7.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThanOrEqual(7);
    }
  });

  it("should not extend if all events in series have isRecurring: false", async () => {
    const seriesId = randomUUID();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create a recurring event
    const event1 = await createTestEvent({
      title: "Recurring Event",
      date: yesterday.toISOString().split("T")[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    });

    // Simulate user unchecking recurring on all events
    const db = getTestDb();
    await db
      .update(events)
      .set({
        isRecurring: false,
        recurringSeriesId: null,
      })
      .where(eq(events.id, event1.id));

    // Run the cronjob
    const result = await extendRecurringEvents();

    expect(result.success).toBe(true);
    // Should not process any series since no events have isRecurring: true
    expect(result.seriesProcessed).toBe(0);
    expect(result.eventsCreated).toBe(0);

    // Verify no new events were created
    const allEvents = await db
      .select()
      .from(events)
      .where(eq(events.recurringSeriesId, seriesId));

    expect(allEvents).toHaveLength(0);
  });
});
