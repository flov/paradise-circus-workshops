import { db } from "@/db"
import { events, users } from "@/db/schema"
import { and, gte, lte, asc, inArray } from "drizzle-orm"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")

  if (!startDate || !endDate) {
    return Response.json({ error: "Start and end dates are required" }, { status: 400 })
  }

  try {
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
      })
      .from(events)
      .where(and(gte(events.date, startDate), lte(events.date, endDate)))
      .orderBy(asc(events.date), asc(events.startTime))

    // Fetch instructor user info for events with instructorId
    const instructorIds = eventsData.filter(e => e.instructorId !== null).map(e => e.instructorId!)
    const instructorMap = new Map<number, { displayName: string | null; username: string }>()
    
    if (instructorIds.length > 0) {
      const instructorUsers = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.id, instructorIds))
      
      instructorUsers.forEach(user => {
        instructorMap.set(user.id, { displayName: user.displayName, username: user.username })
      })
    }

    // Add instructor display name to events
    const eventsWithInstructorInfo = eventsData.map(event => ({
      ...event,
      instructorDisplayName: event.instructorId && instructorMap.has(event.instructorId)
        ? (instructorMap.get(event.instructorId)!.displayName || instructorMap.get(event.instructorId)!.username)
        : null,
    }))

    return Response.json(eventsWithInstructorInfo)
  } catch (error) {
    console.error("Database error:", error)
    return Response.json({ error: "Failed to fetch timetable" }, { status: 500 })
  }
}
