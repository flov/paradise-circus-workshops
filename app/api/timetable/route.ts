import { db } from "@/db"
import { events, users } from "@/db/schema"
import { and, gte, lte, asc, eq, or } from "drizzle-orm"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")
  const userId = searchParams.get("userId")

  if (!startDate || !endDate) {
    return Response.json({ error: "Start and end dates are required" }, { status: 400 })
  }

  try {
    // Build where conditions
    const dateConditions = and(
      gte(events.date, startDate), 
      lte(events.date, endDate)
    )

    // If userId is provided and valid, include both published events and unpublished events for that instructor
    // Otherwise, only show published events
    const parsedUserId = userId ? Number.parseInt(userId, 10) : null
    const isValidUserId = parsedUserId !== null && !Number.isNaN(parsedUserId)
    
    const publishCondition = isValidUserId
      ? or(
          eq(events.isPublished, true),
          and(
            eq(events.isPublished, false),
            eq(events.instructorId, parsedUserId)
          )
        )
      : eq(events.isPublished, true)

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
        instructorProfile: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          bio: users.bio,
          instagramHandle: users.instagramHandle,
          youtubeVideos: users.youtubeVideos,
          experienceStartDate: users.experienceStartDate,
          performanceStyle: users.performanceStyle,
          availableForPerformances: users.availableForPerformances,
          location: users.location,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .where(and(dateConditions, publishCondition))
      .orderBy(asc(events.date), asc(events.startTime))

    // Add instructor display name to events
    const eventsWithInstructorInfo = eventsData.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      instructor: event.instructor,
      instructorId: event.instructorId,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      whatToBring: event.whatToBring,
      isWorkshop: event.isWorkshop,
      currentBookings: event.currentBookings,
      propId: event.propId,
      isPublished: event.isPublished,
      instructorDisplayName: event.instructorProfile
        ? (event.instructorProfile.displayName || event.instructorProfile.username)
        : null,
      instructorProfile: event.instructorProfile,
    }))

    return Response.json(eventsWithInstructorInfo)
  } catch (error) {
    console.error("Database error:", error)
    return Response.json({ error: "Failed to fetch timetable" }, { status: 500 })
  }
}
