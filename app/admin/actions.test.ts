import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Clerk before importing actions that use it
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Import auth helpers first to ensure Clerk mock is set up before importing actions
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
  createEvent,
  approveEvent,
  updateEvent,
  deleteEvent,
  deleteBooking,
  extendRecurringEvents,
  deleteEventAndFutureInstructorEvents,
} from "./actions";
import {
  cleanupDatabase,
  createTestUser,
  createTestEvent,
  createTestParticipation,
  getTestDb,
} from "@/tests/helpers/db";
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
import { events, participations, users } from "@/db/schema";
import { randomUUID } from "crypto";
import { isAdmin, isInstructor, getAllAdmins } from "@/app/profile/actions";

vi.mock("next/cache");
vi.mock("@/app/profile/actions", async () => {
  const actual = await vi.importActual("@/app/profile/actions");
  return {
    ...actual,
    isAdmin: vi.fn().mockResolvedValue(false),
  };
});

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

describe("deleteEventAndFutureInstructorEvents", () => {
  beforeEach(async () => {
    await cleanupDatabase();
    resetAuthMocks();
    resetEmailMocks();
    vi.clearAllMocks();
    // Reset isAdmin mock to return false by default
    vi.mocked(isAdmin).mockResolvedValue(false);
  });

  it("should successfully delete event and all future events with instructorId", async () => {
    const admin = await createTestUser({
      clerkUserId: "admin-user",
      isAdmin: true,
    });
    // Verify admin user was created correctly
    expect(admin.clerkUserId).toBe("admin-user");
    expect(admin.isAdmin).toBe(true);
    
    const instructor = await createTestUser({
      clerkUserId: "instructor-user",
      isInstructor: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create events: one past, one today, one tomorrow, one next week
    const pastEvent = await createTestEvent({
      date: yesterday.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });
    const currentEvent = await createTestEvent({
      date: today.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });
    const futureEvent1 = await createTestEvent({
      date: tomorrow.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });
    const futureEvent2 = await createTestEvent({
      date: nextWeek.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });

    // Create an event with different instructor (should not be deleted)
    const otherInstructor = await createTestUser({
      clerkUserId: "other-instructor",
      isInstructor: true,
    });
    const otherEvent = await createTestEvent({
      date: tomorrow.toISOString().split("T")[0],
      instructorId: otherInstructor.id,
      instructor: null,
    });

    // Verify the admin user exists in the database and isAdmin is true
    const db = getTestDb();
    const adminCheck = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, admin.clerkUserId))
      .limit(1);
    expect(adminCheck).toHaveLength(1);
    expect(adminCheck[0].isAdmin).toBe(true);

    mockAdminAuth(admin.clerkUserId);
    vi.mocked(isAdmin).mockResolvedValue(true);

    await deleteEventAndFutureInstructorEvents(currentEvent.id);

    // Verify paths were revalidated
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/api/timetable");

    // Verify events were deleted
    const remainingEvents = await db
      .select()
      .from(events)
      .where(eq(events.id, currentEvent.id));

    expect(remainingEvents).toHaveLength(0);

    // Verify past event was NOT deleted
    const pastEventCheck = await db
      .select()
      .from(events)
      .where(eq(events.id, pastEvent.id));
    expect(pastEventCheck).toHaveLength(1);

    // Verify future events with same instructor were deleted
    const futureEvent1Check = await db
      .select()
      .from(events)
      .where(eq(events.id, futureEvent1.id));
    expect(futureEvent1Check).toHaveLength(0);

    const futureEvent2Check = await db
      .select()
      .from(events)
      .where(eq(events.id, futureEvent2.id));
    expect(futureEvent2Check).toHaveLength(0);

    // Verify event with different instructor was NOT deleted
    const otherEventCheck = await db
      .select()
      .from(events)
      .where(eq(events.id, otherEvent.id));
    expect(otherEventCheck).toHaveLength(1);
  });

  it("should successfully delete event and all future events with instructor string", async () => {
    const admin = await createTestUser({
      clerkUserId: "admin-user",
      isAdmin: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const instructorName = "Test Instructor Name";

    // Create events with instructor string (no instructorId)
    const currentEvent = await createTestEvent({
      date: today.toISOString().split("T")[0],
      instructor: instructorName,
      instructorId: null,
    });
    const futureEvent1 = await createTestEvent({
      date: tomorrow.toISOString().split("T")[0],
      instructor: instructorName,
      instructorId: null,
    });
    const futureEvent2 = await createTestEvent({
      date: nextWeek.toISOString().split("T")[0],
      instructor: instructorName,
      instructorId: null,
    });

    // Create an event with different instructor string (should not be deleted)
    const otherEvent = await createTestEvent({
      date: tomorrow.toISOString().split("T")[0],
      instructor: "Other Instructor",
      instructorId: null,
    });

    mockAdminAuth(admin.clerkUserId);
    vi.mocked(isAdmin).mockResolvedValue(true);

    await deleteEventAndFutureInstructorEvents(currentEvent.id);

    // Verify events were deleted
    const db = getTestDb();
    const remainingEvents = await db
      .select()
      .from(events)
      .where(eq(events.id, currentEvent.id));

    expect(remainingEvents).toHaveLength(0);

    // Verify future events with same instructor string were deleted
    const futureEvent1Check = await db
      .select()
      .from(events)
      .where(eq(events.id, futureEvent1.id));
    expect(futureEvent1Check).toHaveLength(0);

    const futureEvent2Check = await db
      .select()
      .from(events)
      .where(eq(events.id, futureEvent2.id));
    expect(futureEvent2Check).toHaveLength(0);

    // Verify event with different instructor string was NOT deleted
    const otherEventCheck = await db
      .select()
      .from(events)
      .where(eq(events.id, otherEvent.id));
    expect(otherEventCheck).toHaveLength(1);
  });

  it("should send cancellation emails to all participants", async () => {
    const admin = await createTestUser({
      clerkUserId: "admin-user",
      isAdmin: true,
    });
    const instructor = await createTestUser({
      clerkUserId: "instructor-user",
      isInstructor: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentEvent = await createTestEvent({
      date: today.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });
    const futureEvent = await createTestEvent({
      date: tomorrow.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });

    // Create participations
    const participation1 = await createTestParticipation(currentEvent.id, {
      participantEmail: "participant1@example.com",
      participantName: "Participant 1",
    });
    const participation2 = await createTestParticipation(futureEvent.id, {
      participantEmail: "participant2@example.com",
      participantName: "Participant 2",
    });

    mockAdminAuth(admin.clerkUserId);
    vi.mocked(isAdmin).mockResolvedValue(true);

    await deleteEventAndFutureInstructorEvents(currentEvent.id, "Test cancellation message");

    // Verify emails were sent
    expect(wasEmailSent("participant1@example.com")).toBe(true);
    expect(wasEmailSent("participant2@example.com")).toBe(true);

    const emails = getSentEmails();
    const email1 = emails.find((e) => e.to === "participant1@example.com");
    const email2 = emails.find((e) => e.to === "participant2@example.com");

    expect(email1).toBeDefined();
    expect(email2).toBeDefined();
    if (email1) {
      expect(email1.subject).toContain("cancelled");
      expect(email1.body).toContain("Test cancellation message");
    }
  });

  it("should fail when not authenticated", async () => {
    const event = await createTestEvent();
    mockUnauthenticated();

    await expect(
      deleteEventAndFutureInstructorEvents(event.id),
    ).rejects.toThrow("Unauthorized");
  });

  it("should fail when user is not admin", async () => {
    const regularUser = await createTestUser({
      clerkUserId: "regular-user",
      isAdmin: false,
    });
    const event = await createTestEvent();

    mockRegularUserAuth("regular-user");

    await expect(
      deleteEventAndFutureInstructorEvents(event.id),
    ).rejects.toThrow("Only admins can delete events and all future instructor events");
  });

  it("should fail when event not found", async () => {
    const admin = await createTestUser({
      clerkUserId: "admin-user",
      isAdmin: true,
    });

    mockAdminAuth(admin.clerkUserId);
    vi.mocked(isAdmin).mockResolvedValue(true);

    await expect(
      deleteEventAndFutureInstructorEvents(99999),
    ).rejects.toThrow("Event not found");
  });

  it("should fail when event has no instructor information", async () => {
    const admin = await createTestUser({
      clerkUserId: "admin-user",
      isAdmin: true,
    });

    const event = await createTestEvent({
      instructor: null,
      instructorId: null,
    });

    mockAdminAuth(admin.clerkUserId);
    vi.mocked(isAdmin).mockResolvedValue(true);

    await expect(
      deleteEventAndFutureInstructorEvents(event.id),
    ).rejects.toThrow("Cannot delete future events: event has no instructor information");
  });

  it("should only delete events from current date onwards", async () => {
    const admin = await createTestUser({
      clerkUserId: "admin-user",
      isAdmin: true,
    });
    const instructor = await createTestUser({
      clerkUserId: "instructor-user",
      isInstructor: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create past event (should NOT be deleted)
    const pastEvent = await createTestEvent({
      date: yesterday.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });

    // Create current event (should be deleted)
    const currentEvent = await createTestEvent({
      date: today.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });

    // Create future event (should be deleted)
    const futureEvent = await createTestEvent({
      date: tomorrow.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });

    mockAdminAuth(admin.clerkUserId);
    vi.mocked(isAdmin).mockResolvedValue(true);

    await deleteEventAndFutureInstructorEvents(currentEvent.id);

    // Verify past event was NOT deleted
    const db = getTestDb();
    const pastEventCheck = await db
      .select()
      .from(events)
      .where(eq(events.id, pastEvent.id));
    expect(pastEventCheck).toHaveLength(1);

    // Verify current and future events were deleted
    const currentEventCheck = await db
      .select()
      .from(events)
      .where(eq(events.id, currentEvent.id));
    expect(currentEventCheck).toHaveLength(0);

    const futureEventCheck = await db
      .select()
      .from(events)
      .where(eq(events.id, futureEvent.id));
    expect(futureEventCheck).toHaveLength(0);
  });

  it("should delete participations when events are deleted", async () => {
    const admin = await createTestUser({
      clerkUserId: "admin-user",
      isAdmin: true,
    });
    const instructor = await createTestUser({
      clerkUserId: "instructor-user",
      isInstructor: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentEvent = await createTestEvent({
      date: today.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });
    const futureEvent = await createTestEvent({
      date: tomorrow.toISOString().split("T")[0],
      instructorId: instructor.id,
      instructor: null,
    });

    const participation1 = await createTestParticipation(currentEvent.id);
    const participation2 = await createTestParticipation(futureEvent.id);

    mockAdminAuth(admin.clerkUserId);
    vi.mocked(isAdmin).mockResolvedValue(true);

    await deleteEventAndFutureInstructorEvents(currentEvent.id);

    // Verify participations were deleted (cascade delete)
    const db = getTestDb();
    const participation1Check = await db
      .select()
      .from(participations)
      .where(eq(participations.id, participation1.id));
    expect(participation1Check).toHaveLength(0);

    const participation2Check = await db
      .select()
      .from(participations)
      .where(eq(participations.id, participation2.id));
    expect(participation2Check).toHaveLength(0);
  });
});
