import Link from "next/link";
import { db } from "@/db";
import { events as eventsTable, type Event } from "@/db/schema";
import { gte, asc } from "drizzle-orm";
import { WeeklyTimetable } from "@/components/weekly-timetable";
import { getCurrentUserProfile } from "@/app/profile/actions";

export default async function Home() {
  // Fetch upcoming events ordered by date and time
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  const events = await db
    .select({
      id: eventsTable.id,
      title: eventsTable.title,
      description: eventsTable.description,
      instructor: eventsTable.instructor,
      date: eventsTable.date,
      startTime: eventsTable.startTime,
      endTime: eventsTable.endTime,
      currentBookings: eventsTable.currentBookings,
      location: eventsTable.location,
    })
    .from(eventsTable)
    .where(gte(eventsTable.date, today))
    .orderBy(asc(eventsTable.date), asc(eventsTable.startTime));

  // Fetch current user profile to check instructor and admin status
  const userProfile = await getCurrentUserProfile();
  const isInstructor = userProfile?.isInstructor ?? false;
  const isAdmin = userProfile?.isAdmin ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16"
        suppressHydrationWarning
      >
        {/* Weekly Timetable Section */}
        <WeeklyTimetable isInstructor={isInstructor} isAdmin={isAdmin} userId={userProfile?.id ?? null} />
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
                  Weekly Events
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

            {/* Open Hours */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Open Hours
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Monday – Sunday</p>
                <p>10:00 AM – 12:00 AM</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              Paradise Circus
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
