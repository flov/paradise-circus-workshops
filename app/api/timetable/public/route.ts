import { db } from "@/db";
import { events, users } from "@/db/schema";
import { and, gte, lte, asc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";

async function getPublicTimetableData(startDate: string, endDate: string) {
  const dateConditions = and(
    gte(events.date, startDate),
    lte(events.date, endDate),
  );

  const publishCondition = eq(events.isPublished, true);

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
      currentBookings: events.currentBookings,
      propId: events.propId,
      isPublished: events.isPublished,
      isRecurring: events.isRecurring,
      recurringSeriesId: events.recurringSeriesId,
      recurringUntil: events.recurringUntil,
      recapVideoId: events.recapVideoId,
      createdAt: events.createdAt,
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
    })
    .from(events)
    .leftJoin(users, eq(events.instructorId, users.id))
    .where(and(dateConditions, publishCondition))
    .orderBy(asc(events.date), asc(events.startTime));

  return eventsData.map((event) => ({
    ...event,
    instructorDisplayName: event.instructorProfile
      ? event.instructorProfile.displayName || event.instructorProfile.username
      : null,
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  if (!startDate || !endDate) {
    return Response.json(
      { error: "Start and end dates are required" },
      { status: 400 },
    );
  }

  try {
    // Cache the public timetable data
    // Cache key includes date range to handle different week views
    // Cache duration: 60 seconds in dev, 5 minutes (300s) in production
    const cachedData = unstable_cache(
      async () => getPublicTimetableData(startDate, endDate),
      [`timetable-public-${startDate}-${endDate}`],
      {
        revalidate: process.env.NODE_ENV === "development" ? 60 : 300,
        tags: ["timetable-public"],
      },
    );

    const eventsData = await cachedData();

    return Response.json(eventsData);
  } catch (error) {
    console.error("Database error:", error);
    return Response.json(
      { error: "Failed to fetch timetable" },
      { status: 500 },
    );
  }
}
