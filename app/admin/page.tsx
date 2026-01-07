import { db } from "@/db"
import { workshops, bookings } from "@/db/schema"
import { count, gte, lte, sql, and } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkshopsList } from "@/components/admin/workshops-list"
import { BookingsList } from "@/components/admin/bookings-list"
import { AddWorkshopButton } from "@/components/admin/add-workshop-button"
import { Calendar, Users, TrendingUp, UserCheck } from "lucide-react"

// Helper function to calculate current week date range (Monday-Sunday)
function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const currentDay = now.getDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay

  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0],
  }
}

export default async function AdminPage() {
  // Fetch statistics
  const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
  const { startDate: weekStart, endDate: weekEnd } = getCurrentWeekRange()

  const totalWorkshops = await db.select({ count: count() }).from(workshops)
  const totalBookings = await db.select({ count: count() }).from(bookings)
  const upcomingWorkshops = await db
    .select({ count: count() })
    .from(workshops)
    .where(gte(workshops.date, today))

  // Count distinct instructors for this week
  const instructorsThisWeek = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${workshops.instructor})` })
    .from(workshops)
    .where(and(gte(workshops.date, weekStart), lte(workshops.date, weekEnd)))

  // Count distinct instructors across all workshops
  const totalInstructors = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${workshops.instructor})` })
    .from(workshops)

  const dashboardStats = {
    total_workshops: totalWorkshops[0]?.count || 0,
    total_bookings: totalBookings[0]?.count || 0,
    upcoming_workshops: upcomingWorkshops[0]?.count || 0,
    instructors_this_week: Number(instructorsThisWeek[0]?.count) || 0,
    total_instructors: Number(totalInstructors[0]?.count) || 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage workshops and bookings</p>
            </div>
            <AddWorkshopButton />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_workshops}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Workshops</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.upcoming_workshops}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_bookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instructors This Week</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.instructors_this_week}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_instructors}</div>
            </CardContent>
          </Card>

        </div>

        {/* Main Content */}
        <Tabs defaultValue="workshops" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workshops">Workshops</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="workshops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Workshops</CardTitle>
                <CardDescription>Create, edit, and delete workshops</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkshopsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Bookings</CardTitle>
                <CardDescription>View and manage participant bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingsList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
