import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workshops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateICSFile } from "@/lib/calendar";
import { createWorkshopSlug } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workshopId = Number.parseInt(id);

    if (!workshopId || Number.isNaN(workshopId)) {
      return NextResponse.json(
        { error: "Invalid workshop ID" },
        { status: 400 }
      );
    }

    // Fetch workshop data
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
      .where(eq(workshops.id, workshopId));

    if (workshopResults.length === 0) {
      return NextResponse.json(
        { error: "Workshop not found" },
        { status: 404 }
      );
    }

    const workshop = workshopResults[0];

    // Generate event slug for URL
    const eventSlug = createWorkshopSlug(
      workshop.id,
      workshop.title,
      workshop.instructor
    );

    // Generate iCalendar content (without booking info)
    const icsContent = generateICSFile({
      title: workshop.title,
      date: workshop.date,
      startTime: workshop.startTime,
      endTime: workshop.endTime,
      location: workshop.location,
      instructor: workshop.instructor,
      description: workshop.description,
      whatToBring: workshop.whatToBring,
      bookingId: workshop.id, // Use workshop ID as fallback
      confirmationToken: `workshop-${eventSlug}`, // Store slug in token field for URL generation
    });

    // Sanitize title for filename
    const sanitizedTitle = workshop.title
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .substring(0, 50);

    const filename = `workshop-${workshop.id}-${sanitizedTitle}.ics`;

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
