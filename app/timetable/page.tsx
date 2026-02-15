import type { Metadata } from "next";
import { Suspense } from "react";
import { WeeklyTimetable } from "@/components/weekly-timetable";

export const metadata: Metadata = {
  title: {
    absolute: "Paradise Circus | Timetable",
  },
};

// ISR: Revalidate every hour - profile fetched client-side to keep page static
export const revalidate = 3600;

function TimetableFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted/40 rounded w-64" />
      <div className="h-96 bg-muted/20 rounded-lg" />
    </div>
  );
}

export default function TimetablePage() {
  return (
    <div className="min-h-screen bg-background">
      <main
        className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-16"
        suppressHydrationWarning
      >
        <Suspense fallback={<TimetableFallback />}>
          <WeeklyTimetable />
        </Suspense>
      </main>
    </div>
  );
}
