import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { PropsByUsersChart } from "@/components/admin/dashboard/props-by-users-chart";
import { getPropsStats } from "../../stats";

export default async function PropsStatsPage() {
  const startTime = Date.now();
  
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

  // Fetch props statistics
  const propsStats = await getPropsStats();
  const loadTime = Date.now() - startTime;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Props Statistics"
        description={`Loaded in ${loadTime}ms`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PropsByUsersChart stats={propsStats} />
      </main>
    </div>
  );
}
