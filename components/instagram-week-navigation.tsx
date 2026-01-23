"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InstagramWeekNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Calculate Monday of the current week
  const getMondayOfWeek = (dateStr: string): Date => {
    const date = new Date(dateStr + "T00:00:00");
    const dayOfWeek = date.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const goToWeek = (date: Date) => {
    const dateStr = formatDateForInput(date);
    router.push(`/instagram?date=${dateStr}`);
  };

  const goToPreviousWeek = () => {
    const monday = getMondayOfWeek(currentDate);
    monday.setDate(monday.getDate() - 7);
    goToWeek(monday);
  };

  const goToNextWeek = () => {
    const monday = getMondayOfWeek(currentDate);
    monday.setDate(monday.getDate() + 7);
    goToWeek(monday);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    goToWeek(today);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      router.push(`/instagram?date=${selectedDate}`);
    }
  };

  const monday = getMondayOfWeek(currentDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDateRange = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mondayStr = `${months[monday.getMonth()]} ${monday.getDate()}`;
    const sundayStr = `${months[sunday.getMonth()]} ${sunday.getDate()}`;
    return `${mondayStr} - ${sundayStr}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousWeek}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          onClick={goToCurrentWeek}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-4"
        >
          Today
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextWeek}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-white/70" />
        <Input
          type="date"
          value={formatDateForInput(monday)}
          onChange={handleDateChange}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 w-auto"
        />
        <span className="text-white/70 text-sm hidden sm:inline">
          {formatDateRange()}
        </span>
      </div>
    </div>
  );
}
