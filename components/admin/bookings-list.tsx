import { db } from "@/db"
import { bookings, events } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteBookingButton } from "./delete-booking-button"

type Booking = {
  id: number
  event_id: number
  participant_name: string
  participant_email: string
  phone: string | null
  booking_date: string
  event_title: string
  event_date: string
  event_start_time: string
}

export async function BookingsList() {
  const bookingsData = await db
    .select({
      id: bookings.id,
      event_id: bookings.eventId,
      participant_name: bookings.participantName,
      participant_email: bookings.participantEmail,
      phone: bookings.phone,
      booking_date: bookings.bookingDate,
      event_title: events.title,
      event_date: events.date,
      event_start_time: events.startTime,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .orderBy(desc(bookings.bookingDate))

  const bookingsList: Booking[] = bookingsData.map((b) => ({
    id: b.id,
    event_id: b.event_id,
    participant_name: b.participant_name,
    participant_email: b.participant_email,
    phone: b.phone,
    booking_date: b.booking_date.toISOString(),
    event_title: b.event_title,
    event_date: b.event_date,
    event_start_time: b.event_start_time,
  }))

  if (bookingsList.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No bookings found.</div>
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Booked On</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookingsList.map((booking) => {
            // Combine date and start time to create a proper datetime for comparison
            const eventDateTime = new Date(`${booking.event_date}T${booking.event_start_time}`)
            const isPast = eventDateTime < new Date()

            return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.participant_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.event_title}</span>
                    {isPast && <Badge variant="secondary">Past</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{formatDate(booking.event_date)}</div>
                  <div className="text-muted-foreground">{formatTime(booking.event_start_time)}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(booking.booking_date)}</TableCell>
                <TableCell className="text-sm">
                  <div>{booking.participant_email}</div>
                  {booking.phone && <div className="text-muted-foreground">{booking.phone}</div>}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteBookingButton bookingId={booking.id} eventId={booking.event_id} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
