import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PendingEventsList } from "@/components/admin/pending-events-list";
import { Clock } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin, isInstructor } from "@/app/profile/actions";
import { isEventPast } from "@/lib/utils";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function PendingApprovalPage() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check admin or instructor authorization
  const userIsAdmin = await isAdmin();
  const userIsInstructor = await isInstructor();
  if (!userIsAdmin && !userIsInstructor) {
    redirect("/");
  }

  // Count pending events (unpublished and not past)
  const allPendingEvents = await db
    .select({
      id: events.id,
      date: events.date,
      endTime: events.endTime,
    })
    .from(events)
    .where(eq(events.isPublished, false));

  // Filter out past events
  const pendingEvents = allPendingEvents.filter((event) => {
    return !isEventPast(event.date, event.endTime);
  });

  const pendingCount = pendingEvents.length;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Pending Approval"
        description="Review and approve pending workshops"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {/* Statistics Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Events
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Events awaiting approval
              </p>
            </CardContent>
          </Card>

          {/* Pending Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Workshops</CardTitle>
              <CardDescription>
                Review and approve upcoming workshops that are pending publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingEventsList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
