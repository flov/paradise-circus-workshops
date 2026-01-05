"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TimeSlot = {
  workshop_id: number;
  title: string;
  instructor: string;
  start_time: string;
  end_time: string;
};

type TimetableData = {
  [day: string]: {
    [time: string]: TimeSlot;
  };
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
  "8pm",
  "9pm",
  "10pm",
];

export function WeeklyTimetable() {
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week
  const [timetableData, setTimetableData] = useState<TimetableData>({});
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeekData();
  }, [currentWeek]);

  const loadWeekData = async () => {
    setIsLoading(true);
    const dates = getWeekDates(currentWeek);
    setWeekDates(dates);

    try {
      // Fetch workshops for the current week
      const startDate = dates[0].toISOString().split("T")[0];
      const endDate = dates[6].toISOString().split("T")[0];

      const response = await fetch(
        `/api/timetable?start=${startDate}&end=${endDate}`,
      );
      const workshops = await response.json();

      // Organize workshops into timetable structure
      const organized: TimetableData = {};

      workshops.forEach((workshop: any) => {
        const date = new Date(workshop.date);
        const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const dayName = DAYS[dayIndex];

        // Convert 24h time to 12h format for matching
        const hour = Number.parseInt(workshop.start_time.split(":")[0]);
        const timeSlot =
          hour >= 12 ? `${hour === 12 ? 12 : hour - 12}pm` : `${hour}am`;

        if (!organized[dayName]) organized[dayName] = {};
        organized[dayName][timeSlot] = {
          workshop_id: workshop.id,
          title: workshop.title,
          instructor: workshop.instructor,
          start_time: workshop.start_time,
          end_time: workshop.end_time,
        };
      });

      setTimetableData(organized);
    } catch (error) {
      console.error("Failed to load timetable:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekDates = (weekOffset: number): Date[] => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateRange = () => {
    if (weekDates.length === 0) return "";
    const start = weekDates[0];
    const end = weekDates[6];

    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startStr} - ${endStr}`;
  };

  const goToPreviousWeek = () => setCurrentWeek((prev) => prev - 1);
  const goToNextWeek = () => setCurrentWeek((prev) => prev + 1);
  const goToCurrentWeek = () => setCurrentWeek(0);

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-foreground text-balance">
            Weekly Workshop Timetable
          </h2>
          <p className="text-muted-foreground mt-1">{formatDateRange()}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {currentWeek !== 0 && (
            <Button variant="outline" onClick={goToCurrentWeek}>
              This Week
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
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
                    {DAYS.map((day) => {
                      const slot = timetableData[day]?.[time];
                      return (
                        <td key={`${day}-${time}`} className="p-1.5">
                          {slot ? (
                            <a
                              href={`/book/${slot.workshop_id}`}
                              className="block p-2 rounded bg-primary/10 hover:bg-primary/20 transition-colors h-full"
                            >
                              <div className="text-sm font-medium text-foreground line-clamp-2">
                                {slot.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {slot.instructor}
                              </div>
                            </a>
                          ) : (
                            <div className="p-2 h-full min-h-[60px] bg-muted/20 rounded" />
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

        {/* Mobile View - Daily Cards */}
        <div className="md:hidden p-4 space-y-4">
          {DAYS.map((day, dayIndex) => {
            const daySlots = timetableData[day] || {};
            const hasSlots = Object.keys(daySlots).length > 0;

            return (
              <div
                key={day}
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
                  {hasSlots ? (
                    TIME_SLOTS.map((time) => {
                      const slot = daySlots[time];
                      if (!slot) return null;

                      return (
                        <a
                          key={time}
                          href={`/book/${slot.workshop_id}`}
                          className="block p-3 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="font-medium text-foreground flex-1 min-w-0">
                              {slot.title}
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {time}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.instructor}
                          </div>
                        </a>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No workshops scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-muted-foreground py-8">
          Loading timetable...
        </div>
      )}
    </div>
  );
}