import Link from "next/link";
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
      {/* Main Content */}
      <main
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16"
        suppressHydrationWarning
      >
        {/* Weekly Timetable Section */}
        <WeeklyTimetable />
      </main>

      {/* Footer */}
      <footer
        className="mt-16 border-t border-border bg-card"
        suppressHydrationWarning
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Navigation Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Navigation
              </h3>
              <nav className="flex flex-col space-y-2">
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Weekly Workshops
                </Link>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </nav>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Hours
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Monday – Sunday</p>
                <p>10:00 AM – 12:00 AM</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              Paradise Circus - Where dreams take flight
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
