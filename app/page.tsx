import { neon } from "@neondatabase/serverless"
import { WorkshopCard } from "@/components/workshop-card"
import { WeeklyTimetable } from "@/components/weekly-timetable"
import { Tent, Sparkles } from "lucide-react"

type Workshop = {
  id: number
  title: string
  description: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  current_bookings: number
  location: string
}

export default async function Home() {
  const sql = neon(process.env.DATABASE_URL!)

  // Fetch upcoming workshops ordered by date and time
  const workshops = await sql<Workshop[]>`
    SELECT * FROM workshops 
    WHERE date >= CURRENT_DATE 
    ORDER BY date, start_time
  `

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tent className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold text-foreground text-balance">Paradise Circus</h1>
                <p className="text-sm text-muted-foreground mt-1">Workshop Timetable</p>
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
            <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">Upcoming Workshops</h2>
            <p className="text-muted-foreground text-lg">
              Join us for exciting circus workshops taught by world-class instructors
            </p>
          </div>

          {workshops.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Tent className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No workshops scheduled yet</h3>
              <p className="text-muted-foreground">Check back soon for upcoming workshops!</p>
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
          <p className="text-center text-sm text-muted-foreground">Paradise Circus - Where dreams take flight</p>
        </div>
      </footer>
    </div>
  )
}
