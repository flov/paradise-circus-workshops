"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AddEventButton } from "@/components/admin/add-event-button";
import {
  formatLocalDate,
  getWeekDates,
  getMondayOfWeek,
  getWeekOffsetFromDate,
  convertTimeSlotToTime,
  getNextTimeSlot,
  getCurrentTimeSlot,
  organizeEvents,
  DAYS,
} from "@/lib/timetable-utils";
import type { TimetableData, AuthContext } from "@/lib/timetable-utils";
import { TimetableHeader } from "./timetable-header";
import { DesktopTimetable } from "./desktop-timetable";
import { MobileTimetable } from "./mobile-timetable";

export function WeeklyTimetable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(0);

  const { data: authContext = null } = useQuery<AuthContext>({
    queryKey: ["auth-context", isSignedIn],
    queryFn: async () => {
      if (!isSignedIn)
        return { isAdmin: false, isInstructor: false, userId: null };
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      return {
        isAdmin: data.isAdmin ?? false,
        isInstructor: data.isInstructor ?? false,
        userId: data.userId ?? null,
      };
    },
    staleTime: 5 * 60_000,
  });

  const weekDates = getWeekDates(currentWeek);

  const { data: timetableData = {}, isLoading } = useQuery<TimetableData>({
    queryKey: ["timetable", currentWeek, authContext?.userId ?? null],
    queryFn: async ({ queryKey }) => {
      const [, weekOffset, userId] = queryKey as [
        string,
        number,
        number | null,
      ];
      const dates = getWeekDates(weekOffset);
      const startDate = formatLocalDate(dates[0]);
      const endDate = formatLocalDate(dates[6]);
      const apiUrl = userId
        ? `/api/timetable?start=${startDate}&end=${endDate}&userId=${userId}`
        : `/api/timetable/public?start=${startDate}&end=${endDate}`;
      const response = await fetch(apiUrl);
      const events = await response.json();
      return organizeEvents(events);
    },
    enabled: authContext !== null,
    staleTime: 60_000,
  });

  const [shouldScrollToNow, setShouldScrollToNow] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [prefillValues, setPrefillValues] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const dayCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timeSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
        console.error("Invalid week parameter:", error);
      }
    }
  }, [searchParams]);

  // Invalidate timetable cache when events are mutated
  useEffect(() => {
    const handleEventUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    };

    window.addEventListener("event-updated", handleEventUpdate);
    window.addEventListener("event-created", handleEventUpdate);
    window.addEventListener("event-deleted", handleEventUpdate);

    return () => {
      window.removeEventListener("event-updated", handleEventUpdate);
      window.removeEventListener("event-created", handleEventUpdate);
      window.removeEventListener("event-deleted", handleEventUpdate);
    };
  }, [queryClient]);

  // URL sync
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

  // Scroll-to-now logic
  const performScrollToNow = () => {
    if (currentWeek !== 0) return;

    const now = new Date();
    const currentDay = now.getDay();
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1;

    if (dayIndex < 0 || dayIndex >= DAYS.length) return;

    const dayCard = dayCardRefs.current[dayIndex];
    if (dayCard) {
      dayCard.scrollIntoView({ behavior: "smooth", block: "start" });

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

  const scrollToNow = () => {
    if (currentWeek !== 0) {
      setCurrentWeek(0);
      updateWeekInUrl(0);
      setShouldScrollToNow(true);
      return;
    }
    setTimeout(() => performScrollToNow(), 100);
  };

  useEffect(() => {
    if (shouldScrollToNow && !isLoading && currentWeek === 0) {
      setShouldScrollToNow(false);
      setTimeout(() => performScrollToNow(), 150);
    }
  }, [shouldScrollToNow, isLoading, weekDates, currentWeek]);

  // Add event handlers
  const handleAddEventClick = (dayIndex: number, timeSlot: string) => {
    if (!weekDates[dayIndex]) return;
    const date = formatLocalDate(weekDates[dayIndex]);
    const startTime = convertTimeSlotToTime(timeSlot);
    const endTime = getNextTimeSlot(timeSlot);
    setPrefillValues({ date, startTime, endTime });
    setAddEventOpen(true);
  };

  const handleAddEventForDay = (dayIndex: number) => {
    if (!weekDates[dayIndex]) return;
    const date = formatLocalDate(weekDates[dayIndex]);
    setPrefillValues({ date, startTime: "13:00", endTime: "14:00" });
    setAddEventOpen(true);
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

  return (
    <div className="space-y-4">
      <TimetableHeader
        dateRange={formatDateRange()}
        currentWeek={currentWeek}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={goToCurrentWeek}
        onScrollToNow={scrollToNow}
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <DesktopTimetable
          timetableData={timetableData}
          weekDates={weekDates}
          isLoading={isLoading}
          authContext={authContext}
          onAddEvent={handleAddEventClick}
        />

        <MobileTimetable
          timetableData={timetableData}
          weekDates={weekDates}
          isLoading={isLoading}
          authContext={authContext}
          onAddEventForDay={handleAddEventForDay}
          dayCardRefs={dayCardRefs}
          timeSlotRefs={timeSlotRefs}
        />
      </div>

      <AddEventButton
        open={addEventOpen}
        onOpenChange={(open) => {
          setAddEventOpen(open);
          if (!open) setPrefillValues(null);
        }}
        initialValues={prefillValues || undefined}
        showTrigger={false}
      />
    </div>
  );
}
