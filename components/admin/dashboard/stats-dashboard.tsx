"use client";

import { PropsByUsersChart } from "./props-by-users-chart";
import { CommunityGrowthChart } from "./community-growth-chart";
import { TopInstructorsCard } from "./top-instructors-card";
import type {
  PropStat,
  CommunityGrowthPoint,
  TopInstructor,
} from "@/app/admin/stats";

interface StatsDashboardProps {
  propsStats: PropStat[];
  communityGrowth: CommunityGrowthPoint[];
  topInstructors: TopInstructor[];
}

export function StatsDashboard({
  propsStats,
  communityGrowth,
  topInstructors,
}: StatsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <PropsByUsersChart stats={propsStats} />
        <CommunityGrowthChart data={communityGrowth} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopInstructorsCard instructors={topInstructors} />
      </div>
    </div>
  );
}
