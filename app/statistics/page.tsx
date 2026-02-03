import { PropsByUsersChart } from "@/components/admin/dashboard/props-by-users-chart";
import { getPropsStats } from "@/app/admin/stats";
import { TrendingUp } from "lucide-react";

export default async function StatisticsPage() {
  // Fetch props statistics
  const propsStats = await getPropsStats();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Statistics</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Community insights and prop usage statistics
          </p>
        </div>
        <PropsByUsersChart stats={propsStats} />
      </main>
    </div>
  );
}
