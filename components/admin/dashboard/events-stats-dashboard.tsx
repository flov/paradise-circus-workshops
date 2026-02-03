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
} from "recharts";
import {
  CalendarDays,
  Users,
  Percent,
  ArrowUpRight,
  Orbit,
} from "lucide-react";
import type {
  EventStatsSummary,
  EventsByPropStat,
} from "@/app/admin/stats";

interface EventsStatsDashboardProps {
  summary: EventStatsSummary;
  byProp: EventsByPropStat[];
}

export function EventsStatsDashboard({
  summary,
  byProp,
}: EventsStatsDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Workshops by prop */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Orbit className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Workshops by Prop</CardTitle>
          </div>
          <CardDescription>
            In the below statistics you can see the number of props that have
            been used in the workshops given.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byProp.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No workshops with linked props yet
            </p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byProp.slice(0, 10).map((row) => ({
                    name:
                      row.propName.length > 14
                        ? row.propName.slice(0, 12) + "…"
                        : row.propName,
                    fullName: row.propName,
                    workshops: row.eventCount,
                    participants: row.totalParticipants,
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <defs>
                    <linearGradient
                      id="workshopsByPropBarGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
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
                    width={90}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-1">
                            <p className="text-sm font-medium">{d.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              Workshops: {d.workshops}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="workshops"
                    fill="url(#workshopsByPropBarGradient)"
                    radius={[0, 4, 4, 0]}
                    name="Workshops"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
