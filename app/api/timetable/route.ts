import { db } from "@/db"
import { workshops } from "@/db/schema"
import { and, gte, lte, asc } from "drizzle-orm"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")

  if (!startDate || !endDate) {
    return Response.json({ error: "Start and end dates are required" }, { status: 400 })
  }

  try {
    const workshopsData = await db
      .select({
        id: workshops.id,
        title: workshops.title,
        instructor: workshops.instructor,
        date: workshops.date,
        start_time: workshops.startTime,
        end_time: workshops.endTime,
        location: workshops.location,
        max_capacity: workshops.maxCapacity,
        current_bookings: workshops.currentBookings,
      })
      .from(workshops)
      .where(and(gte(workshops.date, startDate), lte(workshops.date, endDate)))
      .orderBy(asc(workshops.date), asc(workshops.startTime))

    return Response.json(workshopsData)
  } catch (error) {
    console.error("Database error:", error)
    return Response.json({ error: "Failed to fetch timetable" }, { status: 500 })
  }
}
