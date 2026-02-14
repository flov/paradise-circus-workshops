import { db } from "@/db";
import { events, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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

  // Fetch the event with lastUpdatedBy and approvedBy user relations
  const lastUpdatedByUser = alias(users, "lastUpdatedByUser");
  const approvedByUser = alias(users, "approvedByUser");

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
      recurringUntil: events.recurringUntil,
      recapVideoId: events.recapVideoId,
      createdAt: events.createdAt,
      lastUpdatedBy: events.lastUpdatedBy,
      lastUpdatedByUser: {
        id: lastUpdatedByUser.id,
        username: lastUpdatedByUser.username,
        displayName: lastUpdatedByUser.displayName,
      },
      approvedBy: events.approvedBy,
      approvedByUser: {
        id: approvedByUser.id,
        username: approvedByUser.username,
        displayName: approvedByUser.displayName,
      },
    })
    .from(events)
    .leftJoin(lastUpdatedByUser, eq(events.lastUpdatedBy, lastUpdatedByUser.id))
    .leftJoin(approvedByUser, eq(events.approvedBy, approvedByUser.id))
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
  
  // Format recurringUntil date for form (if it exists)
  // recurringUntil from database is already in YYYY-MM-DD format, but ensure it's properly formatted
  let formattedRecurringUntil: string | undefined;
  if (event.recurringUntil) {
    if (typeof event.recurringUntil === "string") {
      if (event.recurringUntil.includes("T") || event.recurringUntil.includes(" ")) {
        // Has time component, extract date part
        formattedRecurringUntil = new Date(event.recurringUntil).toISOString().split("T")[0];
      } else {
        // Already in YYYY-MM-DD format, use directly
        formattedRecurringUntil = event.recurringUntil;
      }
    } else {
      // Date object, format it
      formattedRecurringUntil = new Date(event.recurringUntil).toISOString().split("T")[0];
    }
  }

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
    recurringUntil: formattedRecurringUntil,
    createdAt: event.createdAt,
    lastUpdatedByUser: event.lastUpdatedByUser?.id
      ? {
          id: event.lastUpdatedByUser.id,
          username: event.lastUpdatedByUser.username || "",
          displayName: event.lastUpdatedByUser.displayName,
        }
      : null,
    approvedByUser: event.approvedByUser?.id
      ? {
          id: event.approvedByUser.id,
          username: event.approvedByUser.username || "",
          displayName: event.approvedByUser.displayName,
        }
      : null,
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
          eventSlug={slug}
        />
      </main>
    </div>
  );
}
