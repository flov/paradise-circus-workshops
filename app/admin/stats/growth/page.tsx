import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { CommunityGrowthChart } from "@/components/admin/dashboard/community-growth-chart";
import { DailyUserGrowthChart } from "@/components/admin/dashboard/daily-user-growth-chart";
import { getCommunityGrowth, getDailyUserGrowth } from "../../stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, TrendingUp, Calendar } from "lucide-react";

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

  // Calculate total users
  const totalUsers = dailyUserGrowth.length > 0
    ? dailyUserGrowth[dailyUserGrowth.length - 1].cumulativeUsers
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Community Growth Statistics"
        description={`${totalUsers.toLocaleString()} total users • Data loaded in ${loadTime}ms`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="daily" className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">User Growth Analysis</h1>
            <TabsList>
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Daily</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Weekly</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">All Data</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="daily" className="mt-0">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Daily growth analysis shows new user registrations for each day in the last 30 days,
                including a 7-day moving average to identify trends.
              </p>
              <DailyUserGrowthChart data={dailyUserGrowth} />
            </div>
          </TabsContent>
          
          <TabsContent value="weekly" className="mt-0">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Weekly growth analysis aggregates user registrations by week and shows the cumulative
                growth of the community over time.
              </p>
              <CommunityGrowthChart data={communityGrowth} />
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <div className="space-y-12">
              <div>
                <h2 className="text-xl font-semibold mb-4">Daily Growth (Last 30 Days)</h2>
                <DailyUserGrowthChart data={dailyUserGrowth} />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Weekly Growth Overview</h2>
                <CommunityGrowthChart data={communityGrowth} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
