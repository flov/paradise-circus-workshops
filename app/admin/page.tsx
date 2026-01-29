import { db } from "@/db";
import { events, participations } from "@/db/schema";
import { count, gte, lte, sql, and } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Users, TrendingUp, UserCheck } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUserProfile, isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";

// Helper function to calculate current week date range (Monday-Sunday)
function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
}

export default async function AdminPage() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check admin authorization
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  // Fetch statistics
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const { startDate: weekStart, endDate: weekEnd } = getCurrentWeekRange();

  const totalEvents = await db.select({ count: count() }).from(events);
  const totalParticipations = await db.select({ count: count() }).from(participations);
  const upcomingEvents = await db
    .select({ count: count() })
    .from(events)
    .where(gte(events.date, today));

  // Count distinct instructors for this week
  const instructorsThisWeek = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${events.instructor})` })
    .from(events)
    .where(and(gte(events.date, weekStart), lte(events.date, weekEnd)));

  // Count distinct instructors across all events
  const totalInstructors = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${events.instructor})` })
    .from(events);

  const dashboardStats = {
    total_events: totalEvents[0]?.count || 0,
    total_bookings: totalParticipations[0]?.count || 0,
    upcoming_events: upcomingEvents[0]?.count || 0,
    instructors_this_week: Number(instructorsThisWeek[0]?.count) || 0,
    total_instructors: Number(totalInstructors[0]?.count) || 0,
  };

  // Fetch current user profile to check instructor status
  const userProfile = await getCurrentUserProfile();
  const userIsInstructor = userProfile?.isInstructor ?? false;
  const userIsAdminFlag = userProfile?.isAdmin ?? false;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Admin Dashboard"
        description="Manage events and bookings"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main Content */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Statistics</CardTitle>
                <CardDescription>
                  Overview of events, bookings, and instructors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Events
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.total_events}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Upcoming Events
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.upcoming_events}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Participations
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.total_bookings}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Instructors This Week
                      </CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.instructors_this_week}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Instructors
                      </CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.total_instructors}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
      </main>
    </div>
  );
}
