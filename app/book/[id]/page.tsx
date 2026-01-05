import { db } from "@/db"
import { workshops } from "@/db/schema"
import { eq } from "drizzle-orm"
import { BookingForm } from "@/components/booking-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

export default async function BookWorkshopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const workshopResults = await db
    .select()
    .from(workshops)
    .where(eq(workshops.id, parseInt(id)))

  if (workshopResults.length === 0) {
    notFound()
  }

  const workshopData = workshopResults[0]
  const workshop: Workshop = {
    id: workshopData.id,
    title: workshopData.title,
    description: workshopData.description || "",
    instructor: workshopData.instructor,
    date: workshopData.date,
    start_time: workshopData.startTime,
    end_time: workshopData.endTime,
    max_capacity: workshopData.maxCapacity,
    current_bookings: workshopData.currentBookings,
    location: workshopData.location || "",
  }
  const spotsLeft = workshop.max_capacity - workshop.current_bookings
  const isFull = spotsLeft <= 0

  // Format date
  const date = new Date(workshop.date)
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Timetable
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground text-balance">Book Your Workshop</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Workshop Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-2xl text-balance">{workshop.title}</CardTitle>
                {isFull ? (
                  <Badge variant="destructive">Full</Badge>
                ) : (
                  <Badge variant="outline">{spotsLeft} spots left</Badge>
                )}
              </div>
              <CardDescription className="text-pretty">{workshop.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Date</div>
                    <div className="text-muted-foreground">{formattedDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Time</div>
                    <div className="text-muted-foreground">
                      {formatTime(workshop.start_time)} - {formatTime(workshop.end_time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Location</div>
                    <div className="text-muted-foreground">{workshop.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Instructor</div>
                    <div className="text-muted-foreground">{workshop.instructor}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium text-foreground">
                    {workshop.current_bookings} / {workshop.max_capacity} booked
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <div>
            {isFull ? (
              <Card>
                <CardHeader>
                  <CardTitle>Workshop Full</CardTitle>
                  <CardDescription>
                    This workshop is currently at full capacity. Please check back later or explore other workshops.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/">
                    <Button className="w-full">View Other Workshops</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Booking</CardTitle>
                  <CardDescription>Fill in your details to secure your spot</CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingForm workshopId={workshop.id} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
