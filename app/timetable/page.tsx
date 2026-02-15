import type { Metadata } from "next";
import { WeeklyTimetable } from "@/components/weekly-timetable";

export const metadata: Metadata = {
  title: {
    absolute: "Paradise Circus | Timetable",
  },
};

// ISR: Revalidate every hour - profile fetched client-side to keep page static
export const revalidate = 3600;

export default function TimetablePage() {
  return (
    <div className="min-h-screen bg-background">
      <main
        className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-16"
        suppressHydrationWarning
      >
        <WeeklyTimetable />
      </main>
    </div>
  );
}
