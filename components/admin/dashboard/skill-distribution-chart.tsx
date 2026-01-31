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
  Legend,
} from "recharts";
import type { SkillDistribution } from "@/app/admin/stats";

interface SkillDistributionChartProps {
  data: SkillDistribution[];
}

export function SkillDistributionChart({ data }: SkillDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill Distribution</CardTitle>
          <CardDescription>No skill data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Only show top 8 props for readability
  const displayData = data.slice(0, 8).map((item) => ({
    name: item.propName.length > 12 
      ? item.propName.slice(0, 10) + "..." 
      : item.propName,
    fullName: item.propName,
    Beginner: item.beginner,
    Intermediate: item.intermediate,
    Advanced: item.advanced,
    average: item.averageSkill,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skill Distribution by Prop</CardTitle>
        <CardDescription>
          Beginner (1-3) • Intermediate (4-6) • Advanced (7-10)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              layout="vertical"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-1">
                        <p className="text-sm font-medium">{data.fullName}</p>
                        <p className="text-xs text-green-600">
                          Beginner: {data.Beginner}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Intermediate: {data.Intermediate}
                        </p>
                        <p className="text-xs text-purple-600">
                          Advanced: {data.Advanced}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Avg skill: {data.average.toFixed(1)}/10
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                iconSize={10}
              />
              <Bar
                dataKey="Beginner"
                stackId="a"
                fill="#22c55e"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Intermediate"
                stackId="a"
                fill="#eab308"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Advanced"
                stackId="a"
                fill="#8b5cf6"
                radius={[4, 4, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
