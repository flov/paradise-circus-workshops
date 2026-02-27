import { db } from "@/db";
import { events, users, props } from "@/db/schema";
import { and, gte, lte, asc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { corsJson, corsOptions } from "@/lib/cors";
import { timetableAuthQuerySchema } from "@/lib/validations";

/**
 * Get timetable (events for date range)
 * @description Returns events for the given date range. Admins and instructors see all events; others see published only. Supports optional userId filter for instructor's unpublished events.
 * @params timetableAuthQuerySchema
 * @response timetableResponseSchema
 * @responseSet public
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const parseResult = timetableAuthQuerySchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
    userId: searchParams.get("userId") ?? undefined,
  });
  if (!parseResult.success) {
    return corsJson({ error: parseResult.error.issues[0].message }, { status: 400 });
  }
  const { start: startDate, end: endDate, userId: validatedUserId } = parseResult.data;

  try {
    // Check if user is admin or instructor
    const { userId: clerkUserId } = await auth();
    let userIsAdmin = false;
    let userIsInstructor = false;

    if (clerkUserId) {
      const userResult = await db
        .select({ isAdmin: users.isAdmin, isInstructor: users.isInstructor })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);

      if (userResult.length > 0) {
        userIsAdmin = userResult[0].isAdmin === true;
        userIsInstructor = userResult[0].isInstructor === true;
      }
    }

    // Build where conditions
    const dateConditions = and(
      gte(events.date, startDate),
      lte(events.date, endDate),
    );

    // Build publish condition:
    // - If user is admin: show all events (published and unpublished)
    // - If user is instructor: show all events (published and unpublished) - same as admin
    // - If userId is provided and valid: show published events + unpublished events for that instructor
    // - Otherwise: only show published events
    let publishCondition;
    if (userIsAdmin || userIsInstructor) {
      // Admins and instructors see all events (published and unpublished)
      publishCondition = undefined; // No filter needed
    } else if (validatedUserId !== undefined) {
      // If userId is provided, show published events + their own unpublished events
      publishCondition = or(
        eq(events.isPublished, true),
        and(
          eq(events.isPublished, false),
          eq(events.instructorId, validatedUserId),
        ),
      );
    } else {
      // Regular users only see published events
      publishCondition = eq(events.isPublished, true);
    }

    // Create aliases for lastUpdatedBy and approvedBy user joins
    const lastUpdatedByUser = alias(users, "lastUpdatedByUser");
    const approvedByUser = alias(users, "approvedByUser");

    const eventsData = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        instructor: events.instructor,
        instructorId: events.instructorId,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        whatToBring: events.whatToBring,
        isWorkshop: events.isWorkshop,
        level: events.level,
        currentParticipants: events.currentParticipants,
        prop: {
          id: props.id,
          name: props.name,
        },
        isPublished: events.isPublished,
        isRecurring: events.isRecurring,
        recurringSeriesId: events.recurringSeriesId,
        recurringUntil: events.recurringUntil,
        recapVideoId: events.recapVideoId,
        createdAt: events.createdAt,
        lastUpdatedBy: events.lastUpdatedBy,
        approvedBy: events.approvedBy,
        instructorProfile: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          bio: users.bio,
          instagramHandle: users.instagramHandle,
          youtubeVideos: users.youtubeVideos,
          vimeoVideos: users.vimeoVideos,
          experienceStartDate: users.experienceStartDate,
          performanceStyle: users.performanceStyle,
          availableForPerformances: users.availableForPerformances,
          location: users.location,
        },
        lastUpdatedByUser: {
          id: lastUpdatedByUser.id,
          username: lastUpdatedByUser.username,
          displayName: lastUpdatedByUser.displayName,
        },
        approvedByUser: {
          id: approvedByUser.id,
          username: approvedByUser.username,
          displayName: approvedByUser.displayName,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .leftJoin(props, eq(events.propId, props.id))
      .leftJoin(lastUpdatedByUser, eq(events.lastUpdatedBy, lastUpdatedByUser.id))
      .leftJoin(approvedByUser, eq(events.approvedBy, approvedByUser.id))
      .where(
        publishCondition
          ? and(dateConditions, publishCondition)
          : dateConditions,
      )
      .orderBy(asc(events.date), asc(events.startTime));

    // Return events with computed instructorDisplayName field
    return corsJson(
      eventsData.map((event) => ({
        ...event,
        instructorDisplayName: event.instructorProfile
          ? event.instructorProfile.displayName ||
            event.instructorProfile.username
          : null,
      })),
    );
  } catch (error) {
    console.error("Database error:", error);
    return corsJson(
      { error: "Failed to fetch timetable" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return corsOptions();
}
