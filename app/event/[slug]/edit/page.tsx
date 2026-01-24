import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { parseEventSlug } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { isAdmin, getCurrentUserProfile } from "@/app/profile/actions";
import { EditEventPageClient } from "./edit-event-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Parse the slug to extract the event ID
  const eventId = parseEventSlug(slug);
  if (!eventId) {
    notFound();
  }

  // Fetch the event
  const eventResults = await db
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
      isPublished: events.isPublished,
      propId: events.propId,
      isRecurring: events.isRecurring,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (eventResults.length === 0) {
    notFound();
  }

  const event = eventResults[0];

  // Check authorization: must be admin OR instructor matching instructorId
  const userIsAdmin = await isAdmin();
  let isAuthorized = userIsAdmin;

  if (!userIsAdmin) {
    // Check if user is the instructor
    const userProfile = await getCurrentUserProfile();
    if (userProfile && event.instructorId && userProfile.id === event.instructorId) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    redirect("/");
  }

  // Format date for form
  const formattedDate = new Date(event.date).toISOString().split("T")[0];

  // Convert event to EventFormInitialValues format
  const formInitialValues = {
    id: event.id,
    title: event.title,
    description: event.description || "",
    instructor: event.instructor || "",
    instructorId: event.instructorId,
    date: formattedDate,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    whatToBring: event.whatToBring,
    isWorkshop: event.isWorkshop ?? true,
    isPublished: event.isPublished ?? true,
    propId: event.propId,
    isRecurring: event.isRecurring ?? false,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href={`/event/${slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
            </Link>
            <h1 className="text-1xl font-bold text-foreground text-balance">
              Edit Event
            </h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <EditEventPageClient
          initialValues={formInitialValues}
          eventTitle={event.title}
          eventSlug={slug}
        />
      </main>
    </div>
  );
}
