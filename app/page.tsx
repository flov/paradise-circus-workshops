import { db } from "@/db";
import { workshops as workshopsTable } from "@/db/schema";
import { gte, asc } from "drizzle-orm";
import { WorkshopCard } from "@/components/workshop-card";
import { WeeklyTimetable } from "@/components/weekly-timetable";
import { Tent, Sparkles } from "lucide-react";

type Workshop = {
  id: number;
  title: string;
  description: string;
  instructor: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
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
      maxCapacity: workshopsTable.maxCapacity,
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
    max_capacity: w.maxCapacity,
    current_bookings: w.currentBookings,
    location: w.location || "",
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
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
            <Sparkles className="h-8 w-8 text-secondary" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        {/* Weekly Timetable Section */}
        <WeeklyTimetable />

        {/* Upcoming Workshops Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
              Upcoming Workshops
            </h2>
          </div>

          {workshops.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Tent className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No workshops scheduled yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for upcoming workshops!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workshops.map((workshop) => (
                <WorkshopCard key={workshop.id} workshop={workshop} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Paradise Circus - Where dreams take flight
          </p>
        </div>
      </footer>
    </div>
  );
}
