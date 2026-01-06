"use client";

import Link from "next/link";
import { format, startOfWeek, addDays, parseISO, isSameDay } from "date-fns";
import { Fragment, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Workshop = {
  id: number;
  title: string;
  description: string | null;
  instructor: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  currentBookings: number;
  location: string | null;
};

type WeekCalendarProps = {
  workshops: Workshop[];
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

export function WeekCalendar({ workshops }: WeekCalendarProps) {
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

  // Helper to check if workshop falls in a time slot
  const getWorkshopsForSlot = (day: Date, timeSlot: string) => {
    return workshops.filter((workshop) => {
      const workshopDate =
        typeof workshop.date === "string"
          ? parseISO(workshop.date)
          : new Date(workshop.date);

      if (!isSameDay(workshopDate, day)) return false;

      const workshopHour = Number.parseInt(workshop.startTime.split(":")[0]);
      const slotHour = Number.parseInt(timeSlot.split(":")[0]);

      return workshopHour === slotHour;
    });
  };

  return (
    <div className="space-y-6">
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
          <h1 className="text-white drop-shadow-black">
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
                  const workshopsInSlot = getWorkshopsForSlot(day, timeSlot);

                  return (
                    <div
                      key={`${dayIndex}-${timeSlot}`}
                      className="min-h-[100px] rounded-lg relative"
                    >
                      {workshopsInSlot.length > 0 ? (
                        <div className="space-y-2">
                          {workshopsInSlot.map((workshop) => (
                            <Link
                              key={workshop.id}
                              href={`/book/${workshop.id}`}
                              className="block rounded-lg bg-slate-700 p-3 text-white hover:bg-slate-600 transition-colors h-full border border-slate-600"
                            >
                              <div className="text-sm font-semibold text-balance leading-tight mb-1">
                                {workshop.title}
                              </div>
                              {workshop.instructor && (
                                <div className="text-xs text-slate-300">
                                  {workshop.instructor}
                                </div>
                              )}
                              <div className="text-xs text-slate-400 mt-1">
                                {workshop.startTime.slice(0, 5)}
                              </div>
                            </Link>
                          ))}
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
