import { db } from "@/db"
import { bookings, events } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteBookingButton } from "./delete-booking-button"

export async function BookingsList() {
  const bookingsList = await db
    .select({
      id: bookings.id,
      eventId: bookings.eventId,
      participantName: bookings.participantName,
      participantEmail: bookings.participantEmail,
      phone: bookings.phone,
      bookingDate: bookings.bookingDate,
      eventTitle: events.title,
      eventDate: events.date,
      eventStartTime: events.startTime,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .orderBy(desc(bookings.bookingDate))

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
            const eventDateTime = new Date(`${booking.eventDate}T${booking.eventStartTime}`)
            const isPast = eventDateTime < new Date()

            return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.participantName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.eventTitle}</span>
                    {isPast && <Badge variant="secondary">Past</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{formatDate(booking.eventDate)}</div>
                  <div className="text-muted-foreground">{formatTime(booking.eventStartTime)}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(booking.bookingDate.toISOString())}</TableCell>
                <TableCell className="text-sm">
                  <div>{booking.participantEmail}</div>
                  {booking.phone && <div className="text-muted-foreground">{booking.phone}</div>}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteBookingButton bookingId={booking.id} eventId={booking.eventId} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
