import { db } from "@/db";
import { workshops as workshopsTable } from "@/db/schema";
import { gte, asc } from "drizzle-orm";
import { WorkshopCard } from "@/components/workshop-card";
import { WeeklyTimetable } from "@/components/weekly-timetable";
import { Tent } from "lucide-react";

type Workshop = {
  id: number;
  title: string;
  description: string;
  instructor: string;
  date: string;
  start_time: string;
  end_time: string;
  current_bookings: number;
  location: string;
};

export default async function Home() {
  // Fetch upcoming workshops ordered by date and time
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  const workshopsData = await db
    .select({
      id: workshopsTable.id,
      title: workshopsTable.title,
      description: workshopsTable.description,
      instructor: workshopsTable.instructor,
      date: workshopsTable.date,
      startTime: workshopsTable.startTime,
      endTime: workshopsTable.endTime,
      currentBookings: workshopsTable.currentBookings,
      location: workshopsTable.location,
    })
    .from(workshopsTable)
    .where(gte(workshopsTable.date, today))
    .orderBy(asc(workshopsTable.date), asc(workshopsTable.startTime));

  // Map to match the expected type format
  const workshops: Workshop[] = workshopsData.map((w) => ({
    id: w.id,
    title: w.title,
    description: w.description || "",
    instructor: w.instructor,
    date: w.date,
    start_time: w.startTime,
    end_time: w.endTime,
    current_bookings: w.currentBookings,
    location: w.location || "",
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card" suppressHydrationWarning>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 text-primary text-6xl">🎪</div>
              <div>
                <h1 className="text-4xl font-bold text-foreground text-balance">
                  Paradise Circus
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Workshop Timetable
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16" suppressHydrationWarning>
        {/* Weekly Timetable Section */}
        <WeeklyTimetable />

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-card" suppressHydrationWarning>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Paradise Circus - Where dreams take flight
          </p>
        </div>
      </footer>
    </div>
  );
}
