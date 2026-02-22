import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ACTIVITY_INITIAL_CURSOR } from "@/lib/activity-config";
import { loadMoreActivity } from "@/app/admin/activity/actions";

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  const { logs, hasMore } = await loadMoreActivity(ACTIVITY_INITIAL_CURSOR);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Admin Dashboard"
        description="Recent timetable activity by admins and instructors"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ActivityFeed initialLogs={logs} initialHasMore={hasMore} />
      </main>
    </div>
  );
}
