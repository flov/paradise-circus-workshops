"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopEventSlot } from "./event-slot";
import { DAYS, TIME_SLOTS } from "@/lib/timetable-utils";
import type { TimetableData, AuthContext } from "@/lib/timetable-utils";

type DesktopTimetableProps = {
  timetableData: TimetableData;
  weekDates: Date[];
  isLoading: boolean;
  authContext: AuthContext | null;
  onAddEvent: (dayIndex: number, timeSlot: string) => void;
};

export function DesktopTimetable({
  timetableData,
  weekDates,
  isLoading,
  authContext,
  onAddEvent,
}: DesktopTimetableProps) {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <div className="min-w-[800px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-3 text-left font-semibold text-sm sticky left-0 bg-muted/50 min-w-[80px]">
                TIME
              </th>
              {DAYS.map((day, index) => (
                <th
                  key={day}
                  className="p-3 text-center font-semibold text-sm min-w-[100px]"
                >
                  <div>{day}</div>
                  {weekDates[index] && (
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">
                      {weekDates[index].getDate()}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time) => (
              <tr
                key={time}
                className="border-b border-border last:border-0"
              >
                <td className="p-3 text-sm font-medium text-muted-foreground sticky left-0 bg-background">
                  {time}
                </td>
                {DAYS.map((day, dayIndex) => {
                  const slots = timetableData[day]?.[time] || [];
                  const cellHash =
                    (dayIndex * TIME_SLOTS.length +
                      TIME_SLOTS.indexOf(time)) %
                    8;
                  const showSkeleton = isLoading && cellHash < 4;

                  return (
                    <td key={`${day}-${time}`} className="p-1.5">
                      {isLoading ? (
                        <div className="space-y-1">
                          {showSkeleton ? (
                            <div className="p-2 rounded animate-pulse bg-muted/40 border border-border">
                              <div className="h-4 bg-muted-foreground/20 rounded mb-1.5 w-3/4"></div>
                              <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                            </div>
                          ) : (
                            <div className="p-2 h-full min-h-[60px] bg-muted/20 rounded" />
                          )}
                        </div>
                      ) : slots.length > 0 ? (
                        <div className="space-y-1">
                          {slots.map((slot) => (
                            <DesktopEventSlot
                              key={`${slot.id}-${slot.startTime}-${slot.isBlocked ? "blocked" : "main"}`}
                              slot={slot}
                              authContext={authContext}
                            />
                          ))}
                          {slots.length < 4 &&
                            (authContext?.isInstructor ||
                              authContext?.isAdmin) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-full h-8 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-muted/40 border border-dashed border-border"
                                onClick={() => onAddEvent(dayIndex, time)}
                                aria-label={`Add event at ${day} ${time}`}
                              >
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                        </div>
                      ) : (
                        <div className="p-2 h-full min-h-[60px] bg-muted/20 rounded relative group">
                          {(authContext?.isInstructor ||
                            authContext?.isAdmin) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute inset-0 w-full h-full opacity-30 hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-muted/40"
                              onClick={() => onAddEvent(dayIndex, time)}
                              aria-label={`Add event at ${day} ${time}`}
                            >
                              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
