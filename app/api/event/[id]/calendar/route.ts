import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateICSFile } from "@/lib/calendar";
import { createEventSlug } from "@/lib/utils";

/**
 * Get calendar file for event (ICS)
 * @description Returns an ICS calendar file for a published event. No booking required.
 * @response icsContentSchema
 * @responseSet public
 */
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

    // Fetch event data with instructor profile
    const eventResults = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        instructor: events.instructor,
        instructorId: events.instructorId,
        description: events.description,
        whatToBring: events.whatToBring,
        instructorProfile: {
          displayName: users.displayName,
          username: users.username,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .where(and(eq(events.id, eventId), eq(events.isPublished, true)));

    if (eventResults.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = eventResults[0];
    const instructorName = event.instructorProfile
      ? (event.instructorProfile.displayName || event.instructorProfile.username)
      : event.instructor || '';

    // Generate event slug for URL
    const eventSlug = createEventSlug(
      event.id,
      event.title,
      instructorName
    );

    // Generate iCalendar content (without booking info)
    const icsContent = generateICSFile({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      instructor: instructorName,
      description: event.description,
      whatToBring: event.whatToBring,
      participationId: event.id, // Use event ID as fallback
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
