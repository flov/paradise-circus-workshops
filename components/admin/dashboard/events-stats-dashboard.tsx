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

function formatEventDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(earliest: string, latest: string): number {
  const start = new Date(earliest);
  const end = new Date(latest);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function EventsStatsDashboard({
  summary,
  byProp,
}: EventsStatsDashboardProps) {
  const hasDateRange =
    summary.earliestEventDate && summary.latestEventDate;
  const dayCount = hasDateRange
    ? daysBetween(summary.earliestEventDate, summary.latestEventDate)
    : 0;

  return (
    <div className="space-y-8">
      {hasDateRange && (
        <p className="text-sm text-muted-foreground">
          Statistics span from{" "}
          <span className="font-medium text-foreground">
            {formatEventDate(summary.earliestEventDate)}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {formatEventDate(summary.latestEventDate)}
          </span>{" "}
          ({dayCount} day{dayCount !== 1 ? "s" : ""}).
        </p>
      )}

      {/* Workshops by prop */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Orbit className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Workshops by Prop</CardTitle>
          </div>
          <CardDescription>
            At Paradise we gave <span className="font-bold">{summary.totalWorkshops} workshop
            {summary.totalWorkshops !== 1 ? "s" : ""}</span>
            {hasDateRange ? (
              <>
                {" "}
                within <span className="font-bold">{dayCount} day
                {dayCount !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              ""
            )}
            . Here's a bar chart that shows the workshops sorted by props.
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
