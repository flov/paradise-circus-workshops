"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createEventSlug } from "@/lib/utils";

type TimeSlot = {
  id: number;
  title: string;
  instructor: string;
  startTime: string;
  endTime: string;
  location: string | null;
};

type TimetableData = {
  [day: string]: {
    [time: string]: TimeSlot[];
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
  const [shouldScrollToNow, setShouldScrollToNow] = useState(false);
  const dayCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timeSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    loadWeekData();
  }, [currentWeek]);

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadWeekData = async () => {
    setIsLoading(true);
    const dates = getWeekDates(currentWeek);
    setWeekDates(dates);

    try {
      // Fetch events for the current week
      const startDate = formatLocalDate(dates[0]);
      const endDate = formatLocalDate(dates[6]);

      const response = await fetch(
        `/api/timetable?start=${startDate}&end=${endDate}`,
      );
      const events = await response.json();

      // Organize events into timetable structure
      const organized: TimetableData = {};

      events.forEach((event: any) => {
        const date = new Date(event.date);
        const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const dayName = DAYS[dayIndex];

        // Convert 24h time to 12h format for matching
        const hour = Number.parseInt(event.startTime.split(":")[0]);
        const timeSlot =
          hour >= 12 ? `${hour === 12 ? 12 : hour - 12}pm` : `${hour}am`;

        if (!organized[dayName]) organized[dayName] = {};
        if (!organized[dayName][timeSlot]) organized[dayName][timeSlot] = [];
        organized[dayName][timeSlot].push({
          id: event.id,
          title: event.title,
          instructor: event.instructor,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
        });
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

  // Get current time slot based on current hour
  const getCurrentTimeSlot = (): string | null => {
    const now = new Date();
    const hour = now.getHours();
    
    // Map hours to time slots
    // 12pm = hour 12, 1pm = hour 13, ..., 10pm = hour 22
    if (hour >= 12 && hour <= 22) {
      if (hour === 12) return "12pm";
      return `${hour - 12}pm`;
    }
    
    // For times before 12pm or after 10pm, return null to just scroll to day
    return null;
  };

  // Scroll to current day and time
  const scrollToNow = () => {
    // Switch to current week if not already there
    if (currentWeek !== 0) {
      setCurrentWeek(0);
      setShouldScrollToNow(true);
      return;
    }
    
    // Perform scroll after a short delay to ensure DOM is ready
    setTimeout(() => {
      performScrollToNow();
    }, 100);
  };

  const performScrollToNow = () => {
    // Only scroll if we're on the current week
    if (currentWeek !== 0) {
      return;
    }

    const now = new Date();
    const currentDay = now.getDay();
    // Convert Sunday=0 to Monday=0 (0=Monday, 6=Sunday)
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1;
    
    // Ensure dayIndex is valid
    if (dayIndex < 0 || dayIndex >= DAYS.length) {
      return;
    }
    
    // Scroll to the day card
    const dayCard = dayCardRefs.current[dayIndex];
    if (dayCard) {
      dayCard.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Try to scroll to the current time slot within the day
      const currentTimeSlot = getCurrentTimeSlot();
      if (currentTimeSlot) {
        setTimeout(() => {
          const timeSlotKey = `${dayIndex}-${currentTimeSlot}`;
          const timeSlotElement = timeSlotRefs.current.get(timeSlotKey);
          if (timeSlotElement) {
            timeSlotElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  };

  // Effect to scroll when week changes and shouldScrollToNow is true
  useEffect(() => {
    if (shouldScrollToNow && !isLoading && weekDates.length > 0 && currentWeek === 0) {
      setShouldScrollToNow(false);
      // Add a small delay to ensure refs are set up after DOM update
      setTimeout(() => {
        performScrollToNow();
      }, 150);
    }
  }, [shouldScrollToNow, isLoading, weekDates, currentWeek]);

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-foreground text-balance">
            Weekly Workshop Timetable
          </h2>
          <p className="text-muted-foreground mt-1">
            {formatDateRange()} • All of our workshops are hosted at no cost.
          </p>
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

          {/* Now button - mobile only, only show when viewing current week */}
          {currentWeek === 0 && (
            <Button
              variant="outline"
              onClick={scrollToNow}
              className="md:hidden"
              aria-label="Scroll to now"
            >
              Now
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

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/40"></div>
          <span className="text-muted-foreground">Paradise River</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/40"></div>
          <span className="text-muted-foreground">Paradise Stage</span>
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
                    {DAYS.map((day, dayIndex) => {
                      const slots = timetableData[day]?.[time] || [];
                      // Create a deterministic hash to show skeletons in various cells
                      // Using modulo 8 and showing when hash < 4 gives ~50% coverage
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
                              {slots.map((slot) => {
                                const isParadiseRiver =
                                  slot.location
                                    ?.toLowerCase()
                                    .includes("paradise river") ||
                                  slot.location?.toLowerCase() ===
                                    "paradise river";
                                return (
                                  <a
                                    key={slot.id}
                                    href={`/event/${createEventSlug(slot.id, slot.title, slot.instructor)}`}
                                    className={`block p-2 rounded transition-colors h-full ${
                                      isParadiseRiver
                                        ? "bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40"
                                        : "bg-red-500/20 hover:bg-red-500/30 border border-red-500/40"
                                    }`}
                                  >
                                    <div className="text-sm font-medium text-foreground line-clamp-2">
                                      {slot.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                      {slot.instructor}
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
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
                    // Show skeleton entries for mobile view using modulo 8 for ~50% coverage
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
                      if (slots.length === 0) return null;

                      const timeSlotKey = `${dayIndex}-${time}`;

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
                          {slots.map((slot) => {
                            const isParadiseRiver =
                              slot.location
                                ?.toLowerCase()
                                .includes("paradise river") ||
                              slot.location?.toLowerCase() === "paradise river";
                            return (
                              <a
                                key={slot.id}
                                href={`/event/${createEventSlug(slot.id, slot.title, slot.instructor)}`}
                                className={`block p-4 rounded-lg border-2 shadow-sm hover:shadow-md active:shadow-sm transition-all duration-150 cursor-pointer ${
                                  isParadiseRiver
                                    ? "bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/30 border-blue-500/40 hover:border-blue-500/50 active:border-blue-500/60"
                                    : "bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/30 border-red-500/40 hover:border-red-500/50 active:border-red-500/60"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <div className="font-medium text-foreground flex-1 min-w-0">
                                    {slot.title}
                                  </div>
                                  <div className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                                    {time}
                                    <span
                                      className={
                                        isParadiseRiver
                                          ? "text-blue-600 dark:text-blue-400"
                                          : "text-red-600 dark:text-red-400"
                                      }
                                    >
                                      →
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {slot.instructor}
                                </div>
                              </a>
                            );
                          })}
                        </div>
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
    </div>
  );
}
