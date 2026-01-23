"use client";

import Link from "next/link";
import { format, startOfWeek, addDays, parseISO, isSameDay } from "date-fns";
import { Fragment, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createEventSlug } from "@/lib/utils";
import type { Event } from "@/db/schema";

type WeekCalendarProps = {
  events: Pick<
    Event,
    | "id"
    | "title"
    | "description"
    | "instructor"
    | "date"
    | "startTime"
    | "endTime"
    | "currentBookings"
    | "location"
  >[];
};

const TIME_SLOTS = [
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

export function WeekCalendar({ events }: WeekCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), {
    weekStartsOn: 1,
  }); // Start on Monday

  // Generate days of the week
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get date range for display
  const startDate = format(daysOfWeek[0], "MMM do");
  const endDate = format(daysOfWeek[6], "MMM do");

  // Helper to check if event falls in a time slot
  const getEventsForSlot = (day: Date, timeSlot: string) => {
    return events.filter((event) => {
      const eventDate =
        typeof event.date === "string"
          ? parseISO(event.date)
          : new Date(event.date);

      if (!isSameDay(eventDate, day)) return false;

      const eventHour = Number.parseInt(event.startTime.split(":")[0]);
      const slotHour = Number.parseInt(timeSlot.split(":")[0]);

      return eventHour === slotHour;
    });
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600 border border-blue-500"></div>
          <span className="text-white drop-shadow-black">Paradise River</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600 border border-red-500"></div>
          <span className="text-white drop-shadow-black">Paradise Stage</span>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="bg-slate-700 hover:bg-slate-600 border-slate-600"
        >
          <ChevronLeft className="h-4 w-4 text-white" />
        </Button>

        <div className="text-center">
          <h1
            style={{ fontFamily: "var(--font-rye)" }}
            className="text-white drop-shadow-black"
          >
            Paradise Stage Schedule {startDate} - {endDate}
          </h1>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="bg-slate-700 hover:bg-slate-600 border-slate-600"
        >
          <ChevronRight className="h-4 w-4 text-white" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="grid grid-cols-[80px_repeat(7,minmax(140px,1fr))] gap-2 bg-transparent">
            {/* Header Row - Days */}
            <div className="rounded-lg bg-slate-700 p-3 text-center">
              <span className="text-sm font-bold text-white">TIME</span>
            </div>
            {daysOfWeek.map((day, i) => (
              <div key={i} className="rounded-lg bg-slate-700 p-3 text-center">
                <div className="text-sm font-bold text-white">
                  {format(day, "EEE")}
                </div>
              </div>
            ))}

            {/* Time Rows */}
            {TIME_SLOTS.map((timeSlot) => (
              <Fragment key={timeSlot}>
                {/* Time Label */}
                <div
                  key={`time-${timeSlot}`}
                  className="rounded-lg bg-slate-700 p-3 flex items-center justify-center"
                >
                  <span className="text-sm font-medium text-white">
                    {timeSlot}
                  </span>
                </div>

                {/* Day Cells */}
                {daysOfWeek.map((day, dayIndex) => {
                  const eventsInSlot = getEventsForSlot(day, timeSlot);

                  return (
                    <div
                      key={`${dayIndex}-${timeSlot}`}
                      className="min-h-[100px] rounded-lg relative"
                    >
                      {eventsInSlot.length > 0 ? (
                        <div className="space-y-2">
                          {eventsInSlot.map((event) => {
                            const isParadiseRiver =
                              event.location
                                ?.toLowerCase()
                                .includes("paradise river") ||
                              event.location?.toLowerCase() ===
                                "paradise river";
                            return (
                              <Link
                                key={event.id}
                                href={`/event/${createEventSlug(event.id, event.title, event.instructor)}`}
                                className={`block rounded-lg p-3 text-white transition-colors h-full border ${
                                  isParadiseRiver
                                    ? "bg-blue-600 hover:bg-blue-500 border-blue-500"
                                    : "bg-red-600 hover:bg-red-500 border-red-500"
                                }`}
                              >
                                <div className="text-sm font-semibold text-balance leading-tight mb-1">
                                  {event.title}
                                </div>
                                {event.instructor && (
                                  <div className="text-xs text-slate-300">
                                    {event.instructor}
                                  </div>
                                )}
                                <div className="text-xs text-slate-400 mt-1">
                                  {event.startTime.slice(0, 5)}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full min-h-[100px]" />
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
