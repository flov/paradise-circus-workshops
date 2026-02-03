import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { EventsStatsDashboard } from "@/components/admin/dashboard/events-stats-dashboard";
import { getEventStats } from "../../stats";

export default async function EventStatsPage() {
  const startTime = Date.now();

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  const eventStats = await getEventStats();
  const loadTime = Date.now() - startTime;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Event Statistics"
        description={`Loaded in ${loadTime}ms`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EventsStatsDashboard
          summary={eventStats.summary}
          byProp={eventStats.byProp}
        />
      </main>
    </div>
  );
}
