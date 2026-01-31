import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { SkillDistributionChart } from "@/components/admin/dashboard/skill-distribution-chart";
import { getSkillDistribution } from "../../stats";

export default async function SkillsStatsPage() {
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

  // Fetch skill distribution statistics
  const skillDistribution = await getSkillDistribution();
  const loadTime = Date.now() - startTime;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Skill Distribution Statistics"
        description={`Loaded in ${loadTime}ms`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SkillDistributionChart data={skillDistribution} />
      </main>
    </div>
  );
}
