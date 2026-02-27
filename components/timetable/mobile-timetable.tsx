"use client";

import type { RefObject } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileEventSlot } from "./event-slot";
import { DAYS, TIME_SLOTS } from "@/lib/timetable-utils";
import type { TimetableData, AuthContext } from "@/lib/timetable-utils";

type MobileTimetableProps = {
  timetableData: TimetableData;
  weekDates: Date[];
  isLoading: boolean;
  authContext: AuthContext | null;
  onAddEventForDay: (dayIndex: number) => void;
  dayCardRefs: RefObject<(HTMLDivElement | null)[]>;
  timeSlotRefs: RefObject<Map<string, HTMLDivElement>>;
};

export function MobileTimetable({
  timetableData,
  weekDates,
  isLoading,
  authContext,
  onAddEventForDay,
  dayCardRefs,
  timeSlotRefs,
}: MobileTimetableProps) {
  return (
    <div className="sm:hidden p-4 space-y-4">
      {DAYS.map((day, dayIndex) => {
        const daySlots = timetableData[day] || {};
        const hasSlots = Object.keys(daySlots).length > 0;

        return (
          <div
            key={day}
            ref={(el) => {
              dayCardRefs.current[dayIndex] = el;
            }}
            data-day-index={dayIndex}
            className="border border-border rounded-lg overflow-hidden"
          >
            <div className="bg-muted/50 p-3 font-semibold">
              {day}
              {weekDates[dayIndex] && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {weekDates[dayIndex].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {isLoading ? (
                <>
                  {TIME_SLOTS.map((time, timeIndex) => {
                    const cellHash =
                      (dayIndex * TIME_SLOTS.length + timeIndex) % 8;
                    if (cellHash >= 4) return null;

                    return (
                      <div
                        key={`${day}-${time}`}
                        className="p-4 rounded-lg border-2 border-border animate-pulse bg-muted/40"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="h-5 bg-muted-foreground/20 rounded w-3/4"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-12"></div>
                        </div>
                        <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
                      </div>
                    );
                  })}
                  {TIME_SLOTS.filter((_, timeIndex) => {
                    const cellHash =
                      (dayIndex * TIME_SLOTS.length + timeIndex) % 8;
                    return cellHash < 4;
                  }).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No events scheduled
                    </div>
                  )}
                </>
              ) : hasSlots ? (
                TIME_SLOTS.map((time) => {
                  const slots = daySlots[time] || [];
                  const timeSlotKey = `${dayIndex}-${time}`;

                  if (slots.length === 0) return null;

                  return (
                    <div
                      key={time}
                      ref={(el) => {
                        if (el) {
                          timeSlotRefs.current.set(timeSlotKey, el);
                        }
                      }}
                      data-time-slot={time}
                      data-day-index={dayIndex}
                      className="space-y-2"
                    >
                      {slots
                        .filter((slot) => !slot.isBlocked)
                        .map((slot) => (
                          <MobileEventSlot
                            key={`${slot.id}-${slot.startTime}-main`}
                            slot={slot}
                            authContext={authContext}
                          />
                        ))}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No workshops scheduled
                </div>
              )}
              {(authContext?.isInstructor || authContext?.isAdmin) && (
                <Button
                  variant="outline"
                  className="w-full h-16 border-dashed border-2 hover:border-solid mt-2"
                  onClick={() => onAddEventForDay(dayIndex)}
                  aria-label={`Add event for ${day}`}
                >
                  <Plus className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Add Event
                  </span>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
