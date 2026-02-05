"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import type { DailyGrowthPoint } from "@/app/admin/stats";

interface DailyUserGrowthChartProps {
  data: DailyGrowthPoint[];
}

export function DailyUserGrowthChart({ data }: DailyUserGrowthChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily User Growth</CardTitle>
          <CardDescription>No daily growth data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format date labels for display (YYYY-MM-DD format)
  const formattedData = data.map((point) => {
    const date = new Date(point.date);
    const monthName = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    
    return {
      ...point,
      label: `${monthName} ${day}`,
      fullDate: point.date,
    };
  });

  // Calculate statistics
  const totalNewUsers = data.reduce((sum, point) => sum + point.users, 0);
  const averageNewUsersPerDay = totalNewUsers / data.length;
  const maxDailyUsers = Math.max(...data.map(point => point.users));

  // Only show last 14 days for better readability
  const displayData = formattedData.slice(-14);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daily User Growth</CardTitle>
        <CardDescription>
          {totalNewUsers} new users in the last {data.length} days • 
          Average: {averageNewUsersPerDay.toFixed(1)} users/day • 
          Peak: {maxDailyUsers} users/day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
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
                yAxisId="left"
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
                        <p className="text-sm font-medium">{data.fullDate}</p>
                        <p className="text-xs text-muted-foreground">
                          New users: {data.users}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total users: {data.cumulativeUsers}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="users"
                fill="url(#colorUsers)"
                radius={[4, 4, 0, 0]}
                yAxisId="left"
              />
              <Line 
                type="monotone"
                dataKey="users"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                yAxisId="left"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}