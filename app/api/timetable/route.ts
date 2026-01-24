import { db } from "@/db"
import { events, users } from "@/db/schema"
import { and, gte, lte, asc, eq, or } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")
  const userId = searchParams.get("userId")

  if (!startDate || !endDate) {
    return Response.json({ error: "Start and end dates are required" }, { status: 400 })
  }

  try {
    // Check if user is admin or instructor
    const { userId: clerkUserId } = await auth()
    let userIsAdmin = false
    let userIsInstructor = false
    
    if (clerkUserId) {
      const userResult = await db
        .select({ isAdmin: users.isAdmin, isInstructor: users.isInstructor })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1)
      
      if (userResult.length > 0) {
        userIsAdmin = userResult[0].isAdmin === true
        userIsInstructor = userResult[0].isInstructor === true
      }
    }

    // Build where conditions
    const dateConditions = and(
      gte(events.date, startDate), 
      lte(events.date, endDate)
    )

    // Build publish condition:
    // - If user is admin: show all events (published and unpublished)
    // - If user is instructor: show published events + all unpublished events (from all instructors)
    // - If userId is provided and valid: show published events + unpublished events for that instructor
    // - Otherwise: only show published events
    const parsedUserId = userId ? Number.parseInt(userId, 10) : null
    const isValidUserId = parsedUserId !== null && !Number.isNaN(parsedUserId)
    
    let publishCondition
    if (userIsAdmin) {
      // Admins see all events (published and unpublished)
      publishCondition = undefined // No filter needed
    } else if (userIsInstructor) {
      // Instructors see published events + all unpublished events (from all instructors)
      publishCondition = or(
        eq(events.isPublished, true),
        eq(events.isPublished, false)
      )
    } else if (isValidUserId) {
      // If userId is provided but user is not an instructor, show published events + their own unpublished events
      publishCondition = or(
        eq(events.isPublished, true),
        and(
          eq(events.isPublished, false),
          eq(events.instructorId, parsedUserId)
        )
      )
    } else {
      // Regular users only see published events
      publishCondition = eq(events.isPublished, true)
    }

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
        recapVideoId: events.recapVideoId,
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
      .where(publishCondition ? and(dateConditions, publishCondition) : dateConditions)
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
      isRecurring: event.isRecurring,
      recurringSeriesId: event.recurringSeriesId,
      recapVideoId: event.recapVideoId,
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
