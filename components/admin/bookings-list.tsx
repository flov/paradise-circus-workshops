import { neon } from "@neondatabase/serverless"
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
  const sql = neon(process.env.DATABASE_URL!)

  const bookings = await sql<Booking[]>`
    SELECT 
      b.id, b.workshop_id, b.participant_name, b.participant_email, 
      b.phone, b.booking_date,
      w.title as workshop_title, w.date as workshop_date, w.start_time as workshop_start_time
    FROM bookings b
    JOIN workshops w ON b.workshop_id = w.id
    ORDER BY b.booking_date DESC
  `

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
