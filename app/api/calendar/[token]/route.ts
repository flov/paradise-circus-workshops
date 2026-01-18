import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, events, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateICSFile } from "@/lib/calendar";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length === 0) {
      return NextResponse.json(
        { error: "Invalid booking token" },
        { status: 400 }
      );
    }

    // Fetch booking and event data
    const bookingResults = await db
      .select()
      .from(bookings)
      .where(eq(bookings.confirmationToken, token));

    if (bookingResults.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingResults[0];

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
      .where(eq(events.id, booking.eventId));

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

    // Generate iCalendar content
    const icsContent = generateICSFile({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      instructor: instructorName,
      description: event.description,
      whatToBring: event.whatToBring,
      bookingId: booking.id,
      confirmationToken: booking.confirmationToken,
    });

    // Sanitize title for filename
    const sanitizedTitle = event.title
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .substring(0, 50);

    const filename = `event-${booking.id}-${sanitizedTitle}.ics`;

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

