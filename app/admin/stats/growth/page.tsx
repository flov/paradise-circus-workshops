import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { CommunityGrowthChart } from "@/components/admin/dashboard/community-growth-chart";
import { DailyUserGrowthChart } from "@/components/admin/dashboard/daily-user-growth-chart";
import { getCommunityGrowth, getDailyUserGrowth } from "../../stats";

export default async function GrowthStatsPage() {
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

  // Fetch community growth statistics
  const [communityGrowth, dailyUserGrowth] = await Promise.all([
    getCommunityGrowth(),
    getDailyUserGrowth(),
  ]);
  
  const loadTime = Date.now() - startTime;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Community Growth Statistics"
        description={`Loaded in ${loadTime}ms`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Weekly Growth Overview</h2>
          <CommunityGrowthChart data={communityGrowth} />
          
          <h2 className="text-xl font-semibold mt-10">Daily Growth (Last 30 Days)</h2>
          <DailyUserGrowthChart data={dailyUserGrowth} />
        </div>
      </main>
    </div>
  );
}
