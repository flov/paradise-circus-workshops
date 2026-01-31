"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CommunityGrowthPoint } from "@/app/admin/stats";

interface CommunityGrowthChartProps {
  data: CommunityGrowthPoint[];
}

export function CommunityGrowthChart({ data }: CommunityGrowthChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Community Growth</CardTitle>
          <CardDescription>No growth data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format week labels for display (IYYY-IW format)
  // IYYY = ISO year, IW = ISO week number
  const formattedData = data.map((point) => {
    const [year, week] = point.week.split("-");
    
    // Convert ISO week to approximate date for display
    // ISO week starts on Monday, week 1 contains Jan 4
    const yearNum = parseInt(year);
    const weekNum = parseInt(week);
    
    // Get Jan 4 of the year (always in week 1)
    const jan4 = new Date(yearNum, 0, 4);
    const jan4Day = jan4.getDay() || 7; // Convert Sunday (0) to 7
    const daysToMonday = jan4Day - 1;
    
    // Get first Monday of the year
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - daysToMonday);
    
    // Calculate the Monday of the target week
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
    
    const monthName = weekStart.toLocaleString("default", { month: "short" });
    const day = weekStart.getDate();
    
    return {
      ...point,
      label: `${monthName} ${day}`,
      fullLabel: `Week ${week}, ${year}`,
    };
  });

  // Only show last 12 weeks for better readability
  const displayData = formattedData.slice(-12);

  const totalUsers = data[data.length - 1]?.cumulativeUsers || 0;
  const lastWeekUsers = data[data.length - 1]?.users || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Community Growth</CardTitle>
        <CardDescription>
          {totalUsers} total members • {lastWeekUsers} joined last week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorCumulative"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-1">
                        <p className="text-sm font-medium">{data.fullLabel || data.label}</p>
                        <p className="text-xs text-muted-foreground">
                          New users: {data.users}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {data.cumulativeUsers}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulativeUsers"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
