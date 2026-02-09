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
  ReferenceLine,
  Legend,
} from "recharts";
import type { DailyGrowthPoint } from "@/app/admin/stats";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, Users, Zap } from "lucide-react";

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
    const weekday = date.toLocaleString("default", { weekday: "short" });
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    return {
      ...point,
      label: `${monthName} ${day}`,
      shortLabel: `${day}`,
      weekday,
      isWeekend,
      fullDate: point.date,
    };
  });

  // Calculate statistics
  const totalNewUsers = data.reduce((sum, point) => sum + point.users, 0);
  const averageNewUsersPerDay = totalNewUsers / data.length;
  const maxDailyUsers = Math.max(...data.map(point => point.users));
  
  // Find days with above-average growth
  const aboveAverageDays = data.filter(day => day.users > averageNewUsersPerDay).length;
  const percentAboveAverage = Math.round((aboveAverageDays / data.length) * 100);
  
  // Calculate growth trend (comparing first half to second half)
  const halfIndex = Math.floor(data.length / 2);
  const firstHalfUsers = data.slice(0, halfIndex).reduce((sum, day) => sum + day.users, 0);
  const secondHalfUsers = data.slice(halfIndex).reduce((sum, day) => sum + day.users, 0);
  const growthTrend = ((secondHalfUsers - firstHalfUsers) / firstHalfUsers) * 100;
  
  // Calculate 7-day moving average
  const movingAverageData = [...formattedData];
  for (let i = 6; i < movingAverageData.length; i++) {
    const last7Days = formattedData.slice(i-6, i+1);
    const average = last7Days.reduce((sum, day) => sum + day.users, 0) / 7;
    movingAverageData[i].movingAverage = parseFloat(average.toFixed(1));
  }

  // Only show last 14 days for better readability but with option to see all
  // Controlling the number of visible days
  const displayData = movingAverageData.slice(-30); // Show all 30 days

  // Format day labels to avoid overcrowding
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    const day = date.getDate();
    return day % 5 === 0 ? day.toString() : ""; // Only show every 5th day
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Daily User Growth</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{totalNewUsers} total</span>
            </Badge>
            <Badge variant="outline" className={`flex items-center gap-1 ${growthTrend >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <TrendingUp className="h-3 w-3" />
              <span>{growthTrend >= 0 ? "+" : ""}{growthTrend.toFixed(0)}%</span>
            </Badge>
          </div>
        </div>
        <CardDescription className="pt-1">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> 
              <span>Last 30 days</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" /> 
              <span>Average: {averageNewUsersPerDay.toFixed(1)}/day</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> 
              <span>Peak: {maxDailyUsers} users (single day)</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full">
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
                <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                className="fill-muted-foreground"
                tickFormatter={formatXAxis}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={30}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <div className="grid gap-2">
                        <p className="text-sm font-medium flex items-center justify-between">
                          {data.fullDate}
                          <span className={data.isWeekend ? "text-yellow-500 text-xs" : "text-xs text-muted-foreground"}>
                            {data.weekday}
                          </span>
                        </p>
                        <div className="border-t pt-2">
                          <p className="text-xs font-medium flex items-center justify-between">
                            New users:
                            <Badge variant={data.users > averageNewUsersPerDay ? "default" : "outline"} className="ml-2">
                              {data.users}
                            </Badge>
                          </p>
                          {data.movingAverage && (
                            <p className="text-xs font-medium flex items-center justify-between mt-1">
                              7-day average:
                              <span className="text-xs text-muted-foreground">
                                {data.movingAverage}
                              </span>
                            </p>
                          )}
                          <p className="text-xs font-medium flex items-center justify-between mt-1">
                            Total users:
                            <span className="text-xs text-muted-foreground">
                              {data.cumulativeUsers}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={averageNewUsersPerDay}
                yAxisId="left"
                stroke="#f43f5e"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: "Avg",
                  position: "right",
                  fill: "#f43f5e",
                  fontSize: 10
                }}
              />
              <Bar
                name="Daily new users"
                dataKey="users"
                fill="url(#colorUsers)"
                radius={[4, 4, 0, 0]}
                yAxisId="left"
                barSize={data.length > 20 ? 8 : 16}
              />
              <Line 
                name="7-day average"
                type="monotone"
                dataKey="movingAverage"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                yAxisId="left"
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                iconSize={8}
                iconType="circle"
                verticalAlign="top"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground pt-2 px-2">
          <span>{displayData[0]?.fullDate?.split('-').slice(1).join('/')}</span>
          <span>{displayData[displayData.length-1]?.fullDate?.split('-').slice(1).join('/')}</span>
        </div>
      </CardContent>
    </Card>
  );
}