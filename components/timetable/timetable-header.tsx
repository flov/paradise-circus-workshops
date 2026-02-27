"use client";

import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileLandscapeHint } from "@/components/mobile-landscape-hint";
import Link from "next/link";

type TimetableHeaderProps = {
  dateRange: string;
  currentWeek: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onScrollToNow: () => void;
};

export function TimetableHeader({
  dateRange,
  currentWeek,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onScrollToNow,
}: TimetableHeaderProps) {
  return (
    <>
      <MobileLandscapeHint />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="text-3xl "
            style={{ fontFamily: "var(--font-rye), 'Rye', serif" }}
          >
            Weekly Workshop Timetable
          </h2>
          <div className="flex align-center mt-1 justify-between">
            <p className="text-muted-foreground">{dateRange}</p>
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
            onClick={onPreviousWeek}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {currentWeek !== 0 && (
            <Button variant="outline" onClick={onCurrentWeek}>
              Back to current Week
            </Button>
          )}

          {currentWeek === 0 && (
            <Button
              variant="outline"
              onClick={onScrollToNow}
              className="sm:hidden"
              aria-label="Scroll to now"
            >
              Happening Now
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={onNextWeek}
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
    </>
  );
}
