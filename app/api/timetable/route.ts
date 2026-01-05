import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")

  if (!startDate || !endDate) {
    return Response.json({ error: "Start and end dates are required" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    const workshops = await sql`
      SELECT 
        id, 
        title, 
        instructor, 
        date, 
        start_time, 
        end_time,
        location,
        max_capacity,
        current_bookings
      FROM workshops 
      WHERE date >= ${startDate}::date 
        AND date <= ${endDate}::date
      ORDER BY date, start_time
    `

    return Response.json(workshops)
  } catch (error) {
    console.error("Database error:", error)
    return Response.json({ error: "Failed to fetch timetable" }, { status: 500 })
  }
}
