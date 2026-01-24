import { NextResponse } from "next/server"
import { db } from "@/db"
import { events } from "@/db/schema"
import { eq } from "drizzle-orm"
import { isEventPast } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId")
  
  if (!eventId) {
    return NextResponse.json({ error: "eventId parameter required" }, { status: 400 })
  }
  
  try {
    const eventResults = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
      })
      .from(events)
      .where(eq(events.id, Number.parseInt(eventId, 10)))
      .limit(1)
    
    if (eventResults.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    
    const event = eventResults[0]
    const now = new Date()
    
    // Test the isEventPast function
    const isPast = isEventPast(event.date, event.endTime)
    
    // Parse date and time for debugging
    const dateParts = String(event.date).split('T')[0].split('-')
    const timeParts = event.endTime.split(':')
    const year = Number.parseInt(dateParts[0], 10)
    const month = Number.parseInt(dateParts[1], 10)
    const day = Number.parseInt(dateParts[2], 10)
    const hours = Number.parseInt(timeParts[0], 10)
    const minutes = Number.parseInt(timeParts[1], 10)
    
    // Thailand timezone: UTC+7 (no DST)
    const THAILAND_OFFSET_HOURS = 7
    
    // Convert Thailand time to UTC
    // Example: 2:00 PM Thailand = 7:00 AM UTC (14:00 - 7 = 7:00)
    const eventEndDateUTCMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0)
    const eventEndDate = new Date(eventEndDateUTCMs - (THAILAND_OFFSET_HOURS * 60 * 60 * 1000))
    
    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
      },
      parsed: {
        year,
        month,
        day,
        hours,
        minutes,
        thailandOffset: `+${THAILAND_OFFSET_HOURS}`,
        eventEndDateUTC: eventEndDate.toISOString(),
        eventEndDateLocal: eventEndDate.toString(),
      },
      current: {
        nowUTC: now.toISOString(),
        nowLocal: now.toString(),
      },
      result: {
        isPast,
        comparison: now > eventEndDate,
        differenceMs: now.getTime() - eventEndDate.getTime(),
        differenceHours: (now.getTime() - eventEndDate.getTime()) / (1000 * 60 * 60),
      }
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to check event" }, { status: 500 })
  }
}
