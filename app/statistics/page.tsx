import { unstable_cache } from "next/cache";
import { PropsByUsersChart } from "@/components/admin/dashboard/props-by-users-chart";
import { EventsStatsDashboard } from "@/components/admin/dashboard/events-stats-dashboard";
import { TopInstructorsCard } from "@/components/admin/dashboard/top-instructors-card";
import { getPropsStats, getEventStats, getTopInstructors } from "@/app/admin/stats";
import { TrendingUp } from "lucide-react";

const getCachedStatisticsData = unstable_cache(
  async () => {
    const [propsStats, eventStats, topInstructors] = await Promise.all([
      getPropsStats(),
      getEventStats(),
      getTopInstructors(5), // Get top 5 instructors
    ]);
    return { propsStats, eventStats, topInstructors };
  },
  ["statistics-page"],
  {
    revalidate: process.env.NODE_ENV === "development" ? 60 : 86400,
    tags: ["statistics-page"],
  }
);

function daysBetween(earliest: string, latest: string): number {
  const start = new Date(earliest);
  const end = new Date(latest);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export default async function StatisticsPage() {
  const { propsStats, eventStats, topInstructors } = await getCachedStatisticsData();

  const { summary } = eventStats;
  const hasDateRange =
    summary.earliestEventDate && summary.latestEventDate;
  const dayCount = hasDateRange
    ? daysBetween(summary.earliestEventDate, summary.latestEventDate)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Statistics</h1>
          </div>
          {summary.totalWorkshops > 0 && (
            <p className="text-muted-foreground">
              At Paradise we gave{" "}
              <span className="font-bold text-foreground">
                {summary.totalWorkshops} workshop
                {summary.totalWorkshops !== 1 ? "s" : ""}
              </span>
              {hasDateRange ? (
                <>
                  {" "}
                  within{" "}
                  <span className="font-bold text-foreground">
                    {dayCount} day{dayCount !== 1 ? "s" : ""}
                  </span>
                </>
              ) : null}
              .
            </p>
          )}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <PropsByUsersChart stats={propsStats} />
          <EventsStatsDashboard
            summary={eventStats.summary}
            byProp={eventStats.byProp}
          />
        </div>
        
        {/* Top Instructors Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Most Active Instructors</h2>
          <TopInstructorsCard instructors={topInstructors} />
        </div>
      </main>
    </div>
  );
}
