import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { events as eventsTable, type Event } from "@/db/schema";
import { gte, asc, eq, and } from "drizzle-orm";
import { WeeklyTimetable } from "@/components/weekly-timetable";
import { getCurrentUserProfile } from "@/app/profile/actions";

export const metadata: Metadata = {
  title: {
    absolute: "Paradise Circus | Timetable",
  },
};

export default async function TimetablePage() {
  // Fetch current user profile to check instructor and admin status
  const userProfile = await getCurrentUserProfile();
  const isInstructor = userProfile?.isInstructor ?? false;
  const isAdmin = userProfile?.isAdmin ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main
        className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-16"
        suppressHydrationWarning
      >
        {/* Weekly Timetable Section */}
        <WeeklyTimetable
          isInstructor={isInstructor}
          isAdmin={isAdmin}
          userId={userProfile?.id ?? null}
        />
      </main>
    </div>
  );
}
