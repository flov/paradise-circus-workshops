"use client"

import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Clock, MapPin, Mail, Phone } from "lucide-react"
import { notFound } from "next/navigation"
import Link from "next/link"

type Booking = {
  id: number
  workshop_id: number
  participant_name: string
  participant_email: string
  phone: string | null
  notes: string | null
  booking_date: string
}

type Workshop = {
  id: number
  title: string
  date: string
  start_time: string
  end_time: string
  location: string
  instructor: string
}

export default async function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sql = neon(process.env.DATABASE_URL!)

  const bookings = await sql<Booking[]>`
    SELECT * FROM bookings WHERE id = ${id}
  `

  if (bookings.length === 0) {
    notFound()
  }

  const booking = bookings[0]

  const workshops = await sql<Workshop[]>`
    SELECT id, title, date, start_time, end_time, location, instructor
    FROM workshops WHERE id = ${booking.workshop_id}
  `

  const workshop = workshops[0]

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
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-lg">
            Your spot has been reserved. We'll send a confirmation email shortly.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Booking Details</CardTitle>
              <Badge variant="outline">Booking #{booking.id}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-3">{workshop.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {formatTime(workshop.start_time)} - {formatTime(workshop.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{workshop.location}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground mb-2">Participant Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{booking.participant_email}</span>
                </div>
                {booking.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{booking.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-2">Your Notes</h4>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">Browse More Workshops</Button>
          </Link>
          <Button variant="outline" className="w-full bg-transparent" onClick={() => window.print()}>
            Print Confirmation
          </Button>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-semibold text-foreground mb-2 text-sm">What's Next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Check your email for the confirmation details</li>
            <li>Arrive 15 minutes early to check in</li>
            <li>Bring comfortable clothing and water</li>
            <li>Contact us if you need to make changes</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
