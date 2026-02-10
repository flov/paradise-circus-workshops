"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createEventSlug } from "@/lib/utils";
import { EditEventButton } from "@/components/admin/edit-event-button";
import { AddEventButton } from "@/components/admin/add-event-button";
import { MobileLandscapeHint } from "@/components/mobile-landscape-hint";
import Link from "next/link";

type TimeSlot = {
  id: number;
  title: string;
  description: string | null;
  instructor: string | null;
  instructorId: number | null;
  instructorDisplayName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  whatToBring: string | null;
  isWorkshop: boolean;
  propId: number | null;
  isPublished: boolean;
  isRecurring: boolean;
  recurringSeriesId: string | null;
  createdAt?: string; // ISO date string from API
  isBlocked?: boolean; // Indicates this slot is blocked by an event starting in a previous hour
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

export function WeeklyTimetable({
  isInstructor = false,
  isAdmin = false,
  userId,
}: {
  isInstructor?: boolean;
  isAdmin?: boolean;
  userId?: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week
  const [timetableData, setTimetableData] = useState<TimetableData>({});
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldScrollToNow, setShouldScrollToNow] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [prefillValues, setPrefillValues] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const dayCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timeSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to convert time slot string to HH:MM format
  const convertTimeSlotToTime = (timeSlot: string): string => {
    // Remove "pm" or "am" and convert to number
    const timeStr = timeSlot.replace(/[ap]m/i, "");
    const hour = Number.parseInt(timeStr);

    // Convert to 24-hour format
    // "12pm" -> 12, "1pm" -> 13, etc.
    if (timeSlot.toLowerCase().includes("pm")) {
      const hour24 = hour === 12 ? 12 : hour + 12;
      return `${String(hour24).padStart(2, "0")}:00`;
    } else {
      // Handle am if needed (though TIME_SLOTS only has pm)
      const hour24 = hour === 12 ? 0 : hour;
      return `${String(hour24).padStart(2, "0")}:00`;
    }
  };

  // Helper function to get next time slot
  const getNextTimeSlot = (timeSlot: string): string => {
    const currentIndex = TIME_SLOTS.indexOf(timeSlot);
    if (currentIndex === -1 || currentIndex === TIME_SLOTS.length - 1) {
      // If last slot (10pm), use 23:00 as end time
      return "23:00";
    }
    const nextSlot = TIME_SLOTS[currentIndex + 1];
    return convertTimeSlotToTime(nextSlot);
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

  // Get Monday of a given week offset
  const getMondayOfWeek = (weekOffset: number): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Calculate week offset from a Monday date
  const getWeekOffsetFromDate = (mondayDate: Date): number => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + mondayOffset);
    currentMonday.setHours(0, 0, 0, 0);

    const targetMonday = new Date(mondayDate);
    targetMonday.setHours(0, 0, 0, 0);

    const diffTime = targetMonday.getTime() - currentMonday.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 7);
  };

  // Initialize week from URL query parameter
  useEffect(() => {
    const weekParam = searchParams.get("week");
    if (weekParam) {
      try {
        const mondayDate = new Date(weekParam + "T00:00:00");
        if (!isNaN(mondayDate.getTime())) {
          const weekOffset = getWeekOffsetFromDate(mondayDate);
          setCurrentWeek(weekOffset);
        }
      } catch (error) {
        // Invalid date, use default
        console.error("Invalid week parameter:", error);
      }
    }
  }, [searchParams]);

  const loadWeekData = useCallback(async () => {
    setIsLoading(true);
    const dates = getWeekDates(currentWeek);
    setWeekDates(dates);

    try {
      // Fetch events for the current week
      const startDate = formatLocalDate(dates[0]);
      const endDate = formatLocalDate(dates[6]);

      // Build API URL - use public route for logged-out users, authenticated route for logged-in users
      const apiUrl = userId
        ? `/api/timetable?start=${startDate}&end=${endDate}&userId=${userId}`
        : `/api/timetable/public?start=${startDate}&end=${endDate}`;

      const response = await fetch(apiUrl);
      const events = await response.json();

      // Helper function to calculate duration in hours
      const calculateDurationHours = (
        startTime: string,
        endTime: string,
      ): number => {
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        // Calculate how many hour slots this spans (e.g., 13:00-15:00 spans 2 hours: 1pm and 2pm)
        return Math.ceil(durationMinutes / 60);
      };

      // Helper function to convert hour to time slot string
      const hourToTimeSlot = (hour: number): string => {
        if (hour >= 12) {
          return `${hour === 12 ? 12 : hour - 12}pm`;
        }
        return `${hour}am`;
      };

      // Helper function to get time slot index
      const getTimeSlotIndex = (timeSlot: string): number => {
        return TIME_SLOTS.indexOf(timeSlot);
      };

      // Organize events into timetable structure
      const organized: TimetableData = {};

      events.forEach((event: any) => {
        const date = new Date(event.date);
        const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const dayName = DAYS[dayIndex];

        // Convert 24h time to 12h format for matching
        const startHour = Number.parseInt(event.startTime.split(":")[0]);
        const startTimeSlot = hourToTimeSlot(startHour);

        // Calculate duration in hours
        const durationHours = calculateDurationHours(
          event.startTime,
          event.endTime,
        );

        if (!organized[dayName]) organized[dayName] = {};
        if (!organized[dayName][startTimeSlot])
          organized[dayName][startTimeSlot] = [];

        // Add the main event entry in the start time slot
        organized[dayName][startTimeSlot].push({
          id: event.id,
          title: event.title,
          description: event.description,
          instructor: event.instructor,
          instructorId: event.instructorId || null,
          instructorDisplayName: (event as any).instructorDisplayName || null,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          whatToBring: event.whatToBring,
          isWorkshop: event.isWorkshop,
          propId: event.propId || null,
          isPublished:
            event.isPublished !== undefined ? event.isPublished : true,
          isRecurring: (event as any).isRecurring ?? false,
          recurringSeriesId: (event as any).recurringSeriesId || null,
          createdAt: (event as any).createdAt,
        });

        // For each subsequent hour slot, add a blocked entry
        for (let i = 1; i < durationHours; i++) {
          const nextHour = startHour + i;
          const nextTimeSlot = hourToTimeSlot(nextHour);

          // Only add blocked entries for time slots that exist in TIME_SLOTS
          if (getTimeSlotIndex(nextTimeSlot) !== -1) {
            if (!organized[dayName][nextTimeSlot])
              organized[dayName][nextTimeSlot] = [];

            // Add blocked entry
            organized[dayName][nextTimeSlot].push({
              id: event.id,
              title: event.title,
              description: event.description,
              instructor: event.instructor,
              instructorId: event.instructorId || null,
              instructorDisplayName:
                (event as any).instructorDisplayName || null,
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              whatToBring: event.whatToBring,
              isWorkshop: event.isWorkshop,
              propId: event.propId || null,
              isPublished:
                event.isPublished !== undefined ? event.isPublished : true,
              isRecurring: (event as any).isRecurring ?? false,
              recurringSeriesId: (event as any).recurringSeriesId || null,
              createdAt: (event as any).createdAt,
              isBlocked: true,
            });
          }
        }
      });

      setTimetableData(organized);
    } catch (error) {
      console.error("Failed to load timetable:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeek, userId]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  // Listen for event updates to refresh the timetable
  useEffect(() => {
    const handleEventUpdate = () => {
      loadWeekData();
    };

    // Listen for custom events when events are created, updated, or deleted
    window.addEventListener("event-updated", handleEventUpdate);
    window.addEventListener("event-created", handleEventUpdate);
    window.addEventListener("event-deleted", handleEventUpdate);

    return () => {
      window.removeEventListener("event-updated", handleEventUpdate);
      window.removeEventListener("event-created", handleEventUpdate);
      window.removeEventListener("event-deleted", handleEventUpdate);
    };
  }, [loadWeekData]);

  // Handle clicking on "+" button in empty slot
  const handleAddEventClick = (dayIndex: number, timeSlot: string) => {
    if (!weekDates[dayIndex]) return;

    const date = formatLocalDate(weekDates[dayIndex]);
    const startTime = convertTimeSlotToTime(timeSlot);
    const endTime = getNextTimeSlot(timeSlot);

    setPrefillValues({ date, startTime, endTime });
    setAddEventOpen(true);
  };

  // Handle clicking on "Add Event" button for a day (mobile view)
  const handleAddEventForDay = (dayIndex: number) => {
    if (!weekDates[dayIndex]) return;

    const date = formatLocalDate(weekDates[dayIndex]);
    const startTime = "13:00"; // 1pm
    const endTime = "14:00"; // 2pm

    setPrefillValues({ date, startTime, endTime });
    setAddEventOpen(true);
  };

  // Helper function to format time from HH:MM to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Helper function to check if time is not on the full hour
  const isNotFullHour = (time: string): boolean => {
    const [, minutes] = time.split(":");
    return Number.parseInt(minutes) !== 0;
  };

  // Helper function to format time for display next to title (HH:MM format)
  const formatTimeShort = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}`;
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

  // Update URL when week changes
  const updateWeekInUrl = (weekOffset: number) => {
    const monday = getMondayOfWeek(weekOffset);
    const mondayStr = formatLocalDate(monday);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", mondayStr);
    router.push(`/timetable?${params.toString()}`, { scroll: false });
  };

  const goToPreviousWeek = () => {
    const newWeek = currentWeek - 1;
    setCurrentWeek(newWeek);
    updateWeekInUrl(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = currentWeek + 1;
    setCurrentWeek(newWeek);
    updateWeekInUrl(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(0);
    updateWeekInUrl(0);
  };

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
      updateWeekInUrl(0);
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
            timeSlotElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 300);
      }
    }
  };

  // Effect to scroll when week changes and shouldScrollToNow is true
  useEffect(() => {
    if (
      shouldScrollToNow &&
      !isLoading &&
      weekDates.length > 0 &&
      currentWeek === 0
    ) {
      setShouldScrollToNow(false);
      // Add a small delay to ensure refs are set up after DOM update
      setTimeout(() => {
        performScrollToNow();
      }, 150);
    }
  }, [shouldScrollToNow, isLoading, weekDates, currentWeek]);

  return (
    <div className="space-y-4">
      {/* Mobile landscape hint */}
      <MobileLandscapeHint />

      {/* Header with navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="text-3xl "
            style={{ fontFamily: "var(--font-rye), 'Rye', serif" }}
          >
            Weekly Workshop Timetable
          </h2>
          <div className="flex align-center mt-1 justify-between">
            <p className="text-muted-foreground">{formatDateRange()}</p>
            <Link
              href="/instagram"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram Timetable</span>
            </Link>
          </div>
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
              Back to current Week
            </Button>
          )}

          {/* Now button - mobile only, only show when viewing current week */}
          {currentWeek === 0 && (
            <Button
              variant="outline"
              onClick={scrollToNow}
              className="sm:hidden"
              aria-label="Scroll to now"
            >
              Happening Now
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
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/40"></div>
          <span className="text-muted-foreground">Paradise River</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/40"></div>
          <span className="text-muted-foreground">Paradise Stage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/40"></div>
          <span className="text-muted-foreground">Other Locations</span>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Desktop View */}
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
                                const isParadiseStage =
                                  slot.location === "Paradise Stage";
                                const isParadiseLake =
                                  slot.location === "Paradise River";
                                const isOtherLocation =
                                  !isParadiseStage && !isParadiseLake;
                                const isPending = !slot.isPublished;
                                const hasNoInstructorId =
                                  isAdmin &&
                                  (slot.instructorId === null ||
                                    slot.instructorId === undefined);
                                const isBlocked = slot.isBlocked === true;
                                const getColorClasses = () => {
                                  // Blocked entries get muted styling
                                  if (isBlocked) {
                                    if (isOtherLocation) {
                                      return "bg-purple-500/10 border border-purple-500/20";
                                    }
                                    return isParadiseLake
                                      ? "bg-blue-500/10 border border-blue-500/20"
                                      : "bg-red-500/10 border border-red-500/20";
                                  }
                                  // Pending events get yellow/orange styling
                                  if (isPending) {
                                    return "bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 border-dashed";
                                  }
                                  // Events without instructorId get dashed borders (admin only)
                                  const borderStyle = hasNoInstructorId
                                    ? "border-dashed"
                                    : "border-solid";
                                  if (isOtherLocation) {
                                    return `bg-purple-500/20 hover:bg-purple-500/30 border ${borderStyle} border-purple-500/40`;
                                  }
                                  const baseClasses = isParadiseLake
                                    ? `bg-blue-500/20 hover:bg-blue-500/30 border ${borderStyle} border-blue-500/40`
                                    : `bg-red-500/20 hover:bg-red-500/30 border ${borderStyle} border-red-500/40`;
                                  return baseClasses;
                                };
                                return (
                                  <div
                                    key={`${slot.id}-${slot.startTime}-${isBlocked ? "blocked" : "main"}`}
                                    className={`relative block rounded transition-colors h-full ${getColorClasses()}`}
                                  >
                                    <a
                                      href={`/event/${createEventSlug(slot.id, slot.title, slot.instructorDisplayName || slot.instructor || "")}`}
                                      className={`block p-2 ${isBlocked ? "opacity-60" : ""}`}
                                    >
                                      <div className="text-sm font-medium text-foreground line-clamp-2 flex items-center gap-1.5">
                                        {slot.title}
                                        {isNotFullHour(slot.startTime) && (
                                          <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
                                            {formatTimeShort(slot.startTime)}
                                          </span>
                                        )}
                                        {isPending && (
                                          <span className="ml-1 text-xs font-normal text-yellow-600 dark:text-yellow-400">
                                            (Pending)
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex justify-between">
                                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                          {slot.instructorDisplayName ||
                                            slot.instructor ||
                                            ""}
                                        </div>
                                        {isAdmin && slot.isRecurring && (
                                          <span
                                            className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground"
                                            title="Recurring event"
                                          >
                                            <Repeat className="h-3 w-3" />
                                            <span className="sr-only">
                                              Recurring
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </a>
                                    {(isAdmin ||
                                      (isInstructor &&
                                        slot.instructorId !== null &&
                                        slot.instructorId === userId)) && (
                                      <div
                                        className="absolute top-1 right-1 z-10"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <EditEventButton
                                          event={{
                                            id: slot.id,
                                            title: slot.title,
                                            description: slot.description,
                                            instructor: slot.instructor || "",
                                            instructorId:
                                              slot.instructorId !== null &&
                                              slot.instructorId !== undefined
                                                ? slot.instructorId
                                                : null,
                                            date: slot.date,
                                            startTime: slot.startTime,
                                            endTime: slot.endTime,
                                            location: slot.location,
                                            whatToBring: slot.whatToBring,
                                            isWorkshop: slot.isWorkshop,
                                            propId: slot.propId,
                                            isPublished: slot.isPublished,
                                            isRecurring: slot.isRecurring,
                                            recurringSeriesId:
                                              slot.recurringSeriesId ||
                                              undefined,
                                            createdAt: slot.createdAt
                                              ? new Date(slot.createdAt)
                                              : undefined,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {/* Show "+" button if less than 4 events and user is instructor or admin */}
                              {slots.length < 4 &&
                                (isInstructor || isAdmin) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-full h-8 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-muted/40 border border-dashed border-border"
                                    onClick={() =>
                                      handleAddEventClick(dayIndex, time)
                                    }
                                    aria-label={`Add event at ${day} ${time}`}
                                  >
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                )}
                            </div>
                          ) : (
                            <div className="p-2 h-full min-h-[60px] bg-muted/20 rounded relative group">
                              {(isInstructor || isAdmin) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute inset-0 w-full h-full opacity-30 hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-muted/40"
                                  onClick={() =>
                                    handleAddEventClick(dayIndex, time)
                                  }
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

        {/* Mobile View - Daily Cards */}
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
                      const timeSlotKey = `${dayIndex}-${time}`;

                      if (slots.length === 0) {
                        // Don't show individual "+" buttons for empty slots in mobile view
                        return null;
                      }

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
                            .map((slot) => {
                              const isParadiseStage =
                                slot.location === "Paradise Stage";
                              const isParadiseLake =
                                slot.location === "Paradise River";
                              const isOtherLocation =
                                !isParadiseStage && !isParadiseLake;
                              const isPending = !slot.isPublished;
                              const hasNoInstructorId =
                                isAdmin &&
                                (slot.instructorId === null ||
                                  slot.instructorId === undefined);
                              
                              const getMobileColorClasses = () => {
                                // Pending events get yellow/orange styling
                                if (isPending) {
                                  return "bg-yellow-500/20 hover:bg-yellow-500/30 active:bg-yellow-500/35 border-yellow-500/50 hover:border-yellow-500/60 active:border-yellow-500/70 border-dashed";
                                }
                                // Events without instructorId get dashed borders (admin only)
                                const borderStyle = hasNoInstructorId
                                  ? "border-dashed"
                                  : "border-solid";
                                if (isOtherLocation) {
                                  return `bg-purple-500/15 hover:bg-purple-500/25 active:bg-purple-500/30 ${borderStyle} border-purple-500/40 hover:border-purple-500/50 active:border-purple-500/60`;
                                }
                                const baseClasses = isParadiseLake
                                  ? `bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/30 ${borderStyle} border-blue-500/40 hover:border-blue-500/50 active:border-blue-500/60`
                                  : `bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/30 ${borderStyle} border-red-500/40 hover:border-red-500/50 active:border-red-500/60`;
                                return baseClasses;
                              };
                              return (
                                <div
                                  key={`${slot.id}-${slot.startTime}-main`}
                                  className={`relative block rounded-lg border-2 shadow-sm hover:shadow-md active:shadow-sm transition-all duration-150 ${getMobileColorClasses()}`}
                                >
                                  <a
                                    href={`/event/${createEventSlug(slot.id, slot.title, slot.instructorDisplayName || slot.instructor || "")}`}
                                    className="block p-4 cursor-pointer"
                                  >
                                    <div className="space-y-1.5">
                                      <div className="font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                                        <span className="flex-1 min-w-0">{slot.title}</span>
                                        {isPending && (
                                          <span className="text-xs font-normal text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
                                            (Pending Approval)
                                          </span>
                                        )}
                                        {isAdmin && slot.isRecurring && (
                                          <span
                                            className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground"
                                            title="Recurring event"
                                          >
                                            <Repeat className="h-3 w-3" />
                                            <span className="sr-only">
                                              Recurring
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {slot.instructorDisplayName ||
                                          slot.instructor ||
                                          "Unknown"}
                                      </div>
                                    </div>
                                  </a>
                                {(isAdmin ||
                                  (isInstructor &&
                                    slot.instructorId !== null &&
                                    slot.instructorId === userId)) && (
                                  <div
                                    className="absolute top-2 right-2 z-10"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <EditEventButton
                                      event={{
                                        id: slot.id,
                                        title: slot.title,
                                        description: slot.description,
                                        instructor: slot.instructor || "",
                                        instructorId:
                                          slot.instructorId !== null &&
                                          slot.instructorId !== undefined
                                            ? slot.instructorId
                                            : null,
                                        date: slot.date,
                                        startTime: slot.startTime,
                                        endTime: slot.endTime,
                                        location: slot.location,
                                        whatToBring: slot.whatToBring,
                                        isWorkshop: slot.isWorkshop,
                                        propId: slot.propId,
                                        isPublished: slot.isPublished,
                                        isRecurring: slot.isRecurring,
                                        recurringSeriesId:
                                          slot.recurringSeriesId || undefined,
                                        createdAt: slot.createdAt
                                          ? new Date(slot.createdAt)
                                          : undefined,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
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
                  {/* Single Add Event button per day (mobile view) */}
                  {(isInstructor || isAdmin) && (
                    <Button
                      variant="outline"
                      className="w-full h-16 border-dashed border-2 hover:border-solid mt-2"
                      onClick={() => handleAddEventForDay(dayIndex)}
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
      </div>

      {/* Add Event Dialog - controlled externally */}
      <AddEventButton
        open={addEventOpen}
        onOpenChange={(open) => {
          setAddEventOpen(open);
          if (!open) {
            // Reset prefill values when dialog closes
            setPrefillValues(null);
          }
        }}
        initialValues={prefillValues || undefined}
        showTrigger={false}
      />
    </div>
  );
}
