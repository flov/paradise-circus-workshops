import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventsList } from "@/components/admin/events-list";
import { AddEventButton } from "@/components/admin/add-event-button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Users, Calendar } from "lucide-react";

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
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Event Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create, edit, and delete events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/pending-approval">
                <Button variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Approval
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
              </Link>
              <AddEventButton />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
