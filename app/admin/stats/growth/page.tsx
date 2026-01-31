import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { CommunityGrowthChart } from "@/components/admin/dashboard/community-growth-chart";
import { getCommunityGrowth } from "../../stats";

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
  const communityGrowth = await getCommunityGrowth();
  const loadTime = Date.now() - startTime;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Community Growth Statistics"
        description={`Loaded in ${loadTime}ms`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CommunityGrowthChart data={communityGrowth} />
      </main>
    </div>
  );
}
