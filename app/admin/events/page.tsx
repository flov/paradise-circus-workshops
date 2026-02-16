import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventsList } from "@/components/admin/events-list";
import { AddEventButton } from "@/components/admin/add-event-button";
import { RecurringWorkshopsWithoutEndDateSection } from "@/components/admin/recurring-workshops-without-end-date";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminEventsPage() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check admin authorization
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Event Management"
        description="Create, edit, and delete events"
      >
        <AddEventButton />
      </AdminNav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-muted" />}>
          <RecurringWorkshopsWithoutEndDateSection />
        </Suspense>
        <Card>
          <CardHeader>
            <CardTitle>Manage Events</CardTitle>
            <CardDescription>
              Create, edit, and delete events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventsList />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
