import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkshopsList } from "@/components/admin/workshops-list"
import { BookingsList } from "@/components/admin/bookings-list"
import { AddWorkshopButton } from "@/components/admin/add-workshop-button"
import { BarChart3, Calendar, Users, TrendingUp } from "lucide-react"

type Stats = {
  total_workshops: number
  total_bookings: number
  upcoming_workshops: number
  total_capacity: number
}

export default async function AdminPage() {
  const sql = neon(process.env.DATABASE_URL!)

  // Fetch statistics
  const stats = await sql<Stats[]>`
    SELECT 
      COUNT(DISTINCT w.id) as total_workshops,
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(DISTINCT CASE WHEN w.date >= CURRENT_DATE THEN w.id END) as upcoming_workshops,
      COALESCE(SUM(CASE WHEN w.date >= CURRENT_DATE THEN w.max_capacity END), 0) as total_capacity
    FROM workshops w
    LEFT JOIN bookings b ON w.id = b.workshop_id
  `

  const dashboardStats = stats[0]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage workshops and bookings</p>
            </div>
            <AddWorkshopButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
              <CardTitle className="text-sm font-medium">Available Capacity</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_capacity}</div>
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
