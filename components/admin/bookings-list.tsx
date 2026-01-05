import { db } from "@/db"
import { bookings, workshops } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteBookingButton } from "./delete-booking-button"

type Booking = {
  id: number
  workshop_id: number
  participant_name: string
  participant_email: string
  phone: string | null
  booking_date: string
  workshop_title: string
  workshop_date: string
  workshop_start_time: string
}

export async function BookingsList() {
  const bookingsData = await db
    .select({
      id: bookings.id,
      workshop_id: bookings.workshopId,
      participant_name: bookings.participantName,
      participant_email: bookings.participantEmail,
      phone: bookings.phone,
      booking_date: bookings.bookingDate,
      workshop_title: workshops.title,
      workshop_date: workshops.date,
      workshop_start_time: workshops.startTime,
    })
    .from(bookings)
    .innerJoin(workshops, eq(bookings.workshopId, workshops.id))
    .orderBy(desc(bookings.bookingDate))

  const bookings: Booking[] = bookingsData.map((b) => ({
    id: b.id,
    workshop_id: b.workshop_id,
    participant_name: b.participant_name,
    participant_email: b.participant_email,
    phone: b.phone,
    booking_date: b.booking_date.toISOString(),
    workshop_title: b.workshop_title,
    workshop_date: b.workshop_date,
    workshop_start_time: b.workshop_start_time,
  }))

  if (bookings.length === 0) {
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
            <TableHead>Workshop</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Booked On</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const isPast = new Date(booking.workshop_date) < new Date()

            return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.participant_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.workshop_title}</span>
                    {isPast && <Badge variant="secondary">Past</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{formatDate(booking.workshop_date)}</div>
                  <div className="text-muted-foreground">{formatTime(booking.workshop_start_time)}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(booking.booking_date)}</TableCell>
                <TableCell className="text-sm">
                  <div>{booking.participant_email}</div>
                  {booking.phone && <div className="text-muted-foreground">{booking.phone}</div>}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteBookingButton bookingId={booking.id} workshopId={booking.workshop_id} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
