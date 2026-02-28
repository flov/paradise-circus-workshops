"use server";

import { randomUUID } from "crypto";
import { db } from "@/db";
import { events, participations } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import {
  sendParticipationConfirmationEmail,
  sendAdminNotificationEmail,
  sendCommentNotificationEmail,
} from "@/lib/email";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserName, getUserEmail, createEventSlug } from "@/lib/utils";
import { createParticipationSchema, addCommentSchema } from "@/lib/validations";

export async function createParticipation(formData: FormData) {
  // Get authenticated user
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to participate in an event",
    };
  }

  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unable to retrieve user information" };
  }

  // Get user's name and email from Clerk, fallback to form data
  let clerkName = getUserName(user);
  const clerkEmail = getUserEmail(user);

  // Try to get displayName from database, fallback to Clerk firstName/username
  try {
    const { users } = await import("@/db/schema");
    const userRecord = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userRecord.length > 0 && userRecord[0].displayName) {
      clerkName = userRecord[0].displayName;
    }
  } catch (error) {
    // If database lookup fails, fall back to Clerk name
    console.error("Failed to fetch user displayName:", error);
  }

  const participationResult = createParticipationSchema.safeParse({
    eventId: formData.get("eventId"),
    name: clerkName || formData.get("name"),
    email: clerkEmail || formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });
  if (!participationResult.success) {
    return { success: false, error: participationResult.error.issues[0].message };
  }
  const { eventId, name, email, phone, notes } = participationResult.data;

  try {
    // Check if event exists
    const eventResults = await db
      .select({
        id: events.id,
        currentParticipants: events.currentParticipants,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        instructor: events.instructor,
        whatToBring: events.whatToBring,
      })
      .from(events)
      .where(eq(events.id, eventId));

    if (eventResults.length === 0) {
      return { success: false, error: "Event not found" };
    }

    const event = eventResults[0];

    // Generate confirmation token
    const confirmationToken = randomUUID();

    // Create participation
    const participationResults = await db
      .insert(participations)
      .values({
        eventId: eventId,
        clerkUserId: userId,
        participantName: name,
        participantEmail: email,
        phone: phone || null,
        notes: notes || null,
        confirmationToken,
      })
      .returning({
        id: participations.id,
        confirmationToken: participations.confirmationToken,
      });

    const participationId = participationResults[0].id;
    const token = participationResults[0].confirmationToken;

    // Update event booking count
    await db
      .update(events)
      .set({ currentParticipants: sql`${events.currentParticipants} + 1` })
      .where(eq(events.id, eventId));

    try {
      await sendParticipationConfirmationEmail({
        participantName: name,
        participantEmail: email,
        eventTitle: event.title,
        eventDate: event.date,
        eventStartTime: event.startTime,
        eventEndTime: event.endTime,
        eventLocation: event.location || "",
        instructorName: event.instructor,
        participationId,
        confirmationToken: token,
        whatToBring: event.whatToBring,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Continue even if email fails
    }

    try {
      await sendAdminNotificationEmail({
        participantName: name,
        participantEmail: email,
        participantPhone: phone ?? null,
        eventTitle: event.title,
        eventDate: event.date,
        eventStartTime: event.startTime,
        participationId,
      });
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
      // Continue even if email fails
    }

    // Revalidate relevant pages and caches
    revalidatePath("/");
    revalidatePath(
      `/event/${createEventSlug(eventId, event.title, event.instructor)}`,
    );
    revalidateTag("events");
    revalidateTag(`event-${eventId}`);
    revalidateTag(`event-${eventId}-participations`);

    return { success: true, participationId, confirmationToken: token };
  } catch (error) {
    console.error("Participation error:", error);
    return { success: false, error: "Failed to create participation" };
  }
}

export async function cancelParticipation(participationId: number) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to cancel a participation",
    };
  }

  try {
    // Find the participation and verify ownership
    const participationResults = await db
      .select({
        id: participations.id,
        eventId: participations.eventId,
        clerkUserId: participations.clerkUserId,
      })
      .from(participations)
      .where(eq(participations.id, participationId));

    if (participationResults.length === 0) {
      return { success: false, error: "Participation not found" };
    }

    const participation = participationResults[0];

    // Verify ownership via clerkUserId
    if (!participation.clerkUserId || participation.clerkUserId !== userId) {
      return {
        success: false,
        error: "Unauthorized. You can only cancel your own participations.",
      };
    }

    // Fetch event details for revalidation
    const eventResults = await db
      .select({
        title: events.title,
        instructor: events.instructor,
      })
      .from(events)
      .where(eq(events.id, participation.eventId));

    // Delete the participation
    await db
      .delete(participations)
      .where(eq(participations.id, participationId));

    // Update event participation count
    await db
      .update(events)
      .set({ currentParticipants: sql`${events.currentParticipants} - 1` })
      .where(eq(events.id, participation.eventId));

    // Revalidate relevant pages and caches
    revalidatePath("/");
    revalidateTag("events");
    revalidateTag(`event-${participation.eventId}`);
    revalidateTag(`event-${participation.eventId}-participations`);
    if (eventResults.length > 0) {
      revalidatePath(
        `/event/${createEventSlug(participation.eventId, eventResults[0].title, eventResults[0].instructor)}`,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Cancel participation error:", error);
    return { success: false, error: "Failed to cancel participation" };
  }
}

export async function cancelParticipationByEvent(eventId: number) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to cancel a participation",
    };
  }

  try {
    // Find the user's participation for this event
    const participationResults = await db
      .select({
        id: participations.id,
        eventId: participations.eventId,
      })
      .from(participations)
      .where(
        and(
          eq(participations.eventId, eventId),
          eq(participations.clerkUserId, userId),
        ),
      );

    if (participationResults.length === 0) {
      return { success: false, error: "Participation not found" };
    }

    const participation = participationResults[0];

    // Fetch event details for revalidation
    const eventResults = await db
      .select({
        title: events.title,
        instructor: events.instructor,
      })
      .from(events)
      .where(eq(events.id, eventId));

    // Delete the participation
    await db
      .delete(participations)
      .where(eq(participations.id, participation.id));

    // Update event participation count
    await db
      .update(events)
      .set({ currentParticipants: sql`${events.currentParticipants} - 1` })
      .where(eq(events.id, eventId));

    // Revalidate relevant pages and caches
    revalidatePath("/");
    revalidateTag("events");
    revalidateTag(`event-${eventId}`);
    revalidateTag(`event-${eventId}-participations`);
    if (eventResults.length > 0) {
      revalidatePath(
        `/event/${createEventSlug(eventId, eventResults[0].title, eventResults[0].instructor)}`,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Cancel participation error:", error);
    return { success: false, error: "Failed to cancel participation" };
  }
}

export async function addComment(eventId: number, content: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "You must be signed in to comment" };
  }

  const commentResult = addCommentSchema.safeParse({ eventId, content });
  if (!commentResult.success) {
    return { success: false, error: commentResult.error.issues[0].message };
  }

  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unable to retrieve user information" };
  }

  // Try to get displayName and avatarImageUrl from database, fallback to Clerk firstName/username
  let authorName = getUserName(user);
  let authorImageUrl: string | null = null;

  try {
    const { users } = await import("@/db/schema");
    const userRecord = await db
      .select({
        displayName: users.displayName,
        avatarImageUrl: users.avatarImageUrl,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userRecord.length > 0) {
      if (userRecord[0].displayName) {
        authorName = userRecord[0].displayName;
      }
      authorImageUrl = userRecord[0].avatarImageUrl || null;
    }
  } catch (error) {
    // If database lookup fails, fall back to Clerk name
    console.error("Failed to fetch user profile:", error);
  }

  try {
    // Check if event exists and get full details
    const eventResults = await db
      .select({
        id: events.id,
        title: events.title,
        instructor: events.instructor,
        instructorId: events.instructorId,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
      })
      .from(events)
      .where(eq(events.id, eventId));

    if (eventResults.length === 0) {
      return { success: false, error: "Event not found" };
    }

    const event = eventResults[0];

    // Import comments here to avoid circular import issues
    const { comments, participations, users } = await import("@/db/schema");

    // Create comment
    const commentResults = await db
      .insert(comments)
      .values({
        eventId,
        clerkUserId: userId,
        authorName,
        authorImageUrl,
        content: content.trim(),
      })
      .returning({ id: comments.id });

    // Revalidate event page and caches
    const eventSlug = createEventSlug(eventId, event.title, event.instructor);
    revalidatePath(`/event/${eventSlug}`);
    revalidateTag("events");
    revalidateTag(`event-${eventId}`);
    revalidateTag(`event-${eventId}-comments`);

    // Send notification emails to participants and instructor
    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";
      const eventUrl = `${appUrl}/event/${eventSlug}`;

      // Get all participant emails from participations (excluding the comment author)
      const participantParticipations = await db
        .select({
          participantEmail: participations.participantEmail,
          participantName: participations.participantName,
          clerkUserId: participations.clerkUserId,
        })
        .from(participations)
        .where(eq(participations.eventId, eventId));

      // Get instructor email if instructorId exists
      let instructorEmail: string | null = null;
      let instructorName: string | null = event.instructor;
      let instructorClerkUserId: string | null = null;

      if (event.instructorId) {
        const instructorResult = await db
          .select({
            email: users.email,
            displayName: users.displayName,
            username: users.username,
            clerkUserId: users.clerkUserId,
          })
          .from(users)
          .where(eq(users.id, event.instructorId))
          .limit(1);

        if (instructorResult.length > 0) {
          instructorEmail = instructorResult[0].email || null;
          instructorName =
            instructorResult[0].displayName ||
            instructorResult[0].username ||
            event.instructor;
          instructorClerkUserId = instructorResult[0].clerkUserId || null;
        }
      }

      // Collect all unique recipient emails (excluding the comment author)
      const recipientEmails = new Map<
        string,
        { name: string; isInstructor: boolean }
      >();

      // Add participants
      for (const participation of participantParticipations) {
        // Skip if this participation belongs to the comment author
        if (participation.clerkUserId === userId) {
          continue;
        }
        // Use participant name from participation, or email if name not available
        const name =
          participation.participantName ||
          participation.participantEmail.split("@")[0];
        recipientEmails.set(participation.participantEmail, {
          name,
          isInstructor: false,
        });
      }

      // Add instructor if they exist and are not the comment author
      if (instructorEmail && instructorName) {
        // Skip if instructor is the comment author
        if (instructorClerkUserId !== userId) {
          recipientEmails.set(instructorEmail, {
            name: instructorName,
            isInstructor: true,
          });
        }
      }

      // Send emails to all recipients
      const emailPromises = Array.from(recipientEmails.entries()).map(
        async ([email, { name, isInstructor }]) => {
          try {
            await sendCommentNotificationEmail({
              recipientName: name,
              recipientEmail: email,
              authorName,
              eventTitle: event.title,
              eventDate: event.date,
              eventStartTime: event.startTime,
              eventEndTime: event.endTime,
              eventLocation: event.location || "",
              instructorName,
              commentContent: content.trim(),
              eventUrl,
            });
          } catch (error) {
            console.error(
              `Failed to send comment notification to ${email}:`,
              error,
            );
            // Don't throw - continue sending to other recipients
          }
        },
      );

      // Wait for all emails to be sent (but don't fail if some fail)
      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      // Log error but don't fail the comment creation
      console.error("Error sending comment notification emails:", emailError);
    }

    return { success: true, commentId: commentResults[0].id };
  } catch (error) {
    console.error("Add comment error:", error);
    return { success: false, error: "Failed to add comment" };
  }
}

export async function deleteComment(commentId: number) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to delete a comment",
    };
  }

  try {
    // Import comments here to avoid circular import issues
    const { comments } = await import("@/db/schema");

    // Find the comment and verify ownership
    const commentResults = await db
      .select({
        id: comments.id,
        eventId: comments.eventId,
        clerkUserId: comments.clerkUserId,
      })
      .from(comments)
      .where(eq(comments.id, commentId));

    if (commentResults.length === 0) {
      return { success: false, error: "Comment not found" };
    }

    const comment = commentResults[0];

    // Verify ownership
    if (comment.clerkUserId !== userId) {
      return {
        success: false,
        error: "Unauthorized. You can only delete your own comments.",
      };
    }

    // Get event details for revalidation
    const eventResults = await db
      .select({
        title: events.title,
        instructor: events.instructor,
      })
      .from(events)
      .where(eq(events.id, comment.eventId));

    // Delete the comment
    await db.delete(comments).where(eq(comments.id, commentId));

    // Revalidate event page and caches
    revalidateTag(`event-${comment.eventId}`);
    revalidateTag(`event-${comment.eventId}-comments`);
    if (eventResults.length > 0) {
      revalidatePath(
        `/event/${createEventSlug(comment.eventId, eventResults[0].title, eventResults[0].instructor)}`,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function getInstagramTimetableData(
  startDate?: string,
  location: string = "paradise-stage",
) {
  "use server";

  // Compute week range for cache key (Monday-Sunday)
  const today = startDate ? new Date(startDate) : new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  const startDateStr = monday.toISOString().split("T")[0];
  const cacheKey = ["instagram-timetable", startDateStr, location];

  return unstable_cache(
    async () => {
  try {
    const { events } = await import("@/db/schema");
    const { and, gte, lte, eq, asc, or, sql } = await import("drizzle-orm");

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const endDateStr = sunday.toISOString().split("T")[0];

    // First, check if there are any events in the date range (for debugging)
    const allEventsInRange = await db
      .select({
        id: events.id,
        title: events.title,
        location: events.location,
        date: events.date,
        isPublished: events.isPublished,
      })
      .from(events)
      .where(and(gte(events.date, startDateStr), lte(events.date, endDateStr)))
      .limit(10);

    // Build location filter based on location parameter
    const locationFilter =
      location === "paradise-river"
        ? or(
            sql`LOWER(COALESCE(${events.location}, '')) LIKE '%paradise-river%'`,
            sql`LOWER(COALESCE(${events.location}, '')) LIKE '%paradise river%'`,
            eq(events.location, "paradise-river"),
            eq(events.location, "Paradise River"),
            eq(events.location, "PARADISE RIVER"),
          )
        : or(
            sql`LOWER(COALESCE(${events.location}, '')) LIKE '%paradise-stage%'`,
            sql`LOWER(COALESCE(${events.location}, '')) LIKE '%paradise stage%'`,
            eq(events.location, "paradise-stage"),
            eq(events.location, "Paradise Stage"),
            eq(events.location, "PARADISE STAGE"),
          );

    // Fetch events for the selected location
    // Use case-insensitive matching with SQL template to handle variations
    // Handle null locations by checking if location is not null first
    const { users } = await import("@/db/schema");
    const eventsData = await db
      .select({
        id: events.id,
        title: events.title,
        instructor: events.instructor,
        instructorId: events.instructorId,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        isWorkshop: events.isWorkshop,
        level: events.level,
        instructorUsername: users.username,
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .where(
        and(
          gte(events.date, startDateStr),
          lte(events.date, endDateStr),
          locationFilter,
          eq(events.isPublished, true),
        ),
      )
      .orderBy(asc(events.date), asc(events.startTime));

    // Helper function to format time to "12pm" format
    const formatTimeSlot = (time: string): string => {
      const [hours, minutes] = time.split(":");
      const hour = Number.parseInt(hours);
      const ampm = hour >= 12 ? "pm" : "am";
      const displayHour = hour % 12 || 12;
      // Round to nearest hour for time slots (or use specific logic)
      return `${displayHour}${ampm}`;
    };

    // Helper function to get day abbreviation
    const getDayAbbr = (dateStr: string): string => {
      const date = new Date(dateStr + "T00:00:00");
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[date.getDay()];
    };

    // Generate days array (Mon-Sun) - always in this order
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Create a mapping from day abbreviation to index in the days array
    const dayIndexMap: Record<string, number> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };

    // Collect all unique time slots from events
    const timeSlotSet = new Set<string>();
    eventsData.forEach((event) => {
      timeSlotSet.add(formatTimeSlot(event.startTime));
    });

    // Sort time slots
    const timeSlots = Array.from(timeSlotSet).sort((a, b) => {
      const getHour = (slot: string) => {
        const match = slot.match(/(\d+)(am|pm)/);
        if (!match) return 0;
        let hour = Number.parseInt(match[1]);
        if (match[2] === "pm" && hour !== 12) hour += 12;
        if (match[2] === "am" && hour === 12) hour = 0;
        return hour;
      };
      return getHour(a) - getHour(b);
    });

    // If no events, use default time slots
    if (timeSlots.length === 0) {
      timeSlots.push(
        "11am",
        "12pm",
        "1pm",
        "2pm",
        "3pm",
        "4pm",
        "5pm",
        "6pm",
        "7pm",
        "8pm",
        "10pm",
      );
    }

    // Build events map
    const eventsMap: Record<
      string,
      {
        name: string;
        instructor: string;
        eventId?: number;
        instructorUsername?: string;
        isLogo?: boolean;
        isSpecial?: boolean;
        level?: string;
        span?: number;
        isOccupied?: boolean;
        startsAtHalfHour?: boolean;
      } | null
    > = {};

    // Initialize all slots to null
    timeSlots.forEach((time) => {
      days.forEach((day) => {
        eventsMap[`${time}-${day}`] = null;
      });
    });

    // Helper function to calculate duration in hours (rounded up)
    const calculateDurationHours = (
      startTime: string,
      endTime: string,
    ): number => {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      // Round up to nearest hour for display purposes
      return Math.max(1, Math.ceil(durationMinutes / 60));
    };

    // Fill in events
    eventsData.forEach((event) => {
      const dayAbbr = getDayAbbr(event.date);
      // Only process events that fall within our week (Mon-Sun)
      if (dayIndexMap[dayAbbr] !== undefined) {
        const startTimeSlot = formatTimeSlot(event.startTime);
        const durationHours = calculateDurationHours(
          event.startTime,
          event.endTime,
        );

        // Find the index of the start time slot
        const startSlotIndex = timeSlots.indexOf(startTimeSlot);

        // Calculate how many consecutive slots this event spans
        // Make sure we don't exceed available slots
        const span =
          startSlotIndex !== -1
            ? Math.min(durationHours, timeSlots.length - startSlotIndex)
            : 1;

        const key = `${startTimeSlot}-${dayAbbr}`;

        // Check if event starts at :30 (half-hour)
        const [startHours, startMinutes] = event.startTime.split(":").map(Number);
        const startsAtHalfHour = startMinutes === 30;

        // Check if event title contains special keywords
        const titleUpper = event.title.toUpperCase();
        const isSpecial =
          titleUpper.includes("FIRESHOW") ||
          titleUpper.includes("OPEN MIC") ||
          titleUpper.includes("OPEN STAGE");

        eventsMap[key] = {
          name: event.title,
          instructor: event.instructor || "",
          eventId: event.id,
          instructorUsername: event.instructorUsername || undefined,
          isSpecial,
          level: event.isWorkshop && event.level !== "All levels" ? event.level : undefined,
          span, // Store span for CSS grid row spanning
          startsAtHalfHour, // Flag for half-hour starts
        };
      }
    });

    // Generate title
    const formatDate = (date: Date): string => {
      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${month} ${day}${getOrdinalSuffix(day)}`;
    };

    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return "TH";
      switch (day % 10) {
        case 1:
          return "ST";
        case 2:
          return "ND";
        case 3:
          return "RD";
        default:
          return "TH";
      }
    };

    const locationName =
      location === "paradise-river" ? "PARADISE RIVER" : "PARADISE STAGE";
    const title = `${locationName} SCHEDULE ${formatDate(monday)} - ${formatDate(sunday)}`;

    return {
      title,
      days,
      timeSlots,
      events: eventsMap,
    };
  } catch (error) {
    console.error("Error fetching Instagram timetable data:", error);
    throw error;
  }
    },
    cacheKey,
    { revalidate: 300, tags: ["timetable-public", "instagram-timetable"] }
  )();
}
