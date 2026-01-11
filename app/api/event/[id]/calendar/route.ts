import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateICSFile } from "@/lib/calendar";
import { createEventSlug } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = Number.parseInt(id);

    if (!eventId || Number.isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    // Fetch event data
    const eventResults = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        instructor: events.instructor,
        description: events.description,
        whatToBring: events.whatToBring,
      })
      .from(events)
      .where(eq(events.id, eventId));

    if (eventResults.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = eventResults[0];

    // Generate event slug for URL
    const eventSlug = createEventSlug(
      event.id,
      event.title,
      event.instructor
    );

    // Generate iCalendar content (without booking info)
    const icsContent = generateICSFile({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      instructor: event.instructor,
      description: event.description,
      whatToBring: event.whatToBring,
      bookingId: event.id, // Use event ID as fallback
      confirmationToken: `event-${eventSlug}`, // Store slug in token field for URL generation
    });

    // Sanitize title for filename
    const sanitizedTitle = event.title
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .substring(0, 50);

    const filename = `event-${event.id}-${sanitizedTitle}.ics`;

    // Return .ics file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating calendar file:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar file" },
      { status: 500 }
    );
  }
}
