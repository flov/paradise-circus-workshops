"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TimeSlotData } from "@/app/admin/stats";

interface WorkshopTimeHeatmapProps {
  data: TimeSlotData[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Only show hours from 8am to 10pm for cleaner display
const DISPLAY_HOURS = HOURS.filter((h) => h >= 8 && h <= 22);

export function WorkshopTimeHeatmap({ data }: WorkshopTimeHeatmapProps) {
  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  let maxCount = 0;

  data.forEach((slot) => {
    const key = `${slot.dayOfWeek}-${slot.hour}`;
    dataMap.set(key, slot.count);
    if (slot.count > maxCount) {
      maxCount = slot.count;
    }
  });

  const getCount = (day: number, hour: number): number => {
    return dataMap.get(`${day}-${hour}`) || 0;
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-purple-200 dark:bg-purple-900/30";
    if (ratio <= 0.5) return "bg-purple-300 dark:bg-purple-800/50";
    if (ratio <= 0.75) return "bg-purple-400 dark:bg-purple-700/70";
    return "bg-purple-500 dark:bg-purple-600";
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
  };

  const totalWorkshops = data.reduce((sum, slot) => sum + slot.count, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workshop Schedule Heatmap</CardTitle>
          <CardDescription>No workshop time data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workshop Schedule Heatmap</CardTitle>
        <CardDescription>
          {totalWorkshops} workshops • Most popular times shown darker
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Hours header */}
            <div className="flex mb-1">
              <div className="w-10 shrink-0" />
              {DISPLAY_HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-[10px] text-muted-foreground text-center"
                >
                  {hour % 2 === 0 ? formatHour(hour) : ""}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="space-y-1">
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-1">
                  <div className="w-10 text-xs text-muted-foreground shrink-0">
                    {day}
                  </div>
                  <div className="flex-1 flex gap-0.5">
                    {DISPLAY_HOURS.map((hour) => {
                      const count = getCount(dayIndex, hour);
                      return (
                        <Tooltip key={`${dayIndex}-${hour}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex-1 aspect-square rounded-sm transition-colors",
                                "hover:ring-2 hover:ring-primary/50",
                                getIntensity(count)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">
                              {day} {formatHour(hour)}: {count} workshop
                              {count !== 1 ? "s" : ""}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-0.5">
                <div className="size-3 rounded-sm bg-muted" />
                <div className="size-3 rounded-sm bg-purple-200 dark:bg-purple-900/30" />
                <div className="size-3 rounded-sm bg-purple-300 dark:bg-purple-800/50" />
                <div className="size-3 rounded-sm bg-purple-400 dark:bg-purple-700/70" />
                <div className="size-3 rounded-sm bg-purple-500 dark:bg-purple-600" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
