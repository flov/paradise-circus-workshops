import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { ActivityFeed } from "@/components/admin/activity-feed";

export default async function ActivityPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Activity"
        description="Recent timetable activity by admins and instructors"
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="text-center py-12 text-muted-foreground">
              Loading activity...
            </div>
          }
        >
          <ActivityFeed />
        </Suspense>
      </main>
    </div>
  );
}
