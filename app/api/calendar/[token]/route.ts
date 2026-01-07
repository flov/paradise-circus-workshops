import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, workshops } from "@/db/schema";
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

    // Fetch booking and workshop data
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

    const workshopResults = await db
      .select({
        id: workshops.id,
        title: workshops.title,
        date: workshops.date,
        startTime: workshops.startTime,
        endTime: workshops.endTime,
        location: workshops.location,
        instructor: workshops.instructor,
        description: workshops.description,
        whatToBring: workshops.whatToBring,
      })
      .from(workshops)
      .where(eq(workshops.id, booking.workshopId));

    if (workshopResults.length === 0) {
      return NextResponse.json(
        { error: "Workshop not found" },
        { status: 404 }
      );
    }

    const workshop = workshopResults[0];

    // Generate iCalendar content
    const icsContent = generateICSFile({
      title: workshop.title,
      date: workshop.date,
      startTime: workshop.startTime,
      endTime: workshop.endTime,
      location: workshop.location,
      instructor: workshop.instructor,
      description: workshop.description,
      whatToBring: workshop.whatToBring,
      bookingId: booking.id,
      confirmationToken: booking.confirmationToken,
    });

    // Sanitize title for filename
    const sanitizedTitle = workshop.title
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .substring(0, 50);

    const filename = `workshop-${booking.id}-${sanitizedTitle}.ics`;

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

