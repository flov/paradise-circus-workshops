import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecurringEventsCopyPanel } from "@/components/admin/recurring-events-copy-panel";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminRecurringEventsPage() {
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
        title="Recurring Events"
        description="Find and copy recurring events to the next calendar week"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Copy Recurring Events</CardTitle>
            <CardDescription>
              Find published recurring events from the current and previous weeks,
              then copy them to the next calendar week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecurringEventsCopyPanel />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
