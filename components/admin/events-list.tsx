import { db } from "@/db"
import { events } from "@/db/schema"
import { desc } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditEventButton } from "./edit-event-button"
import { DeleteEventButton } from "./delete-event-button"
import Link from "next/link"
import { createEventSlug } from "@/lib/utils"

type Event = {
  id: number
  title: string
  description: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  current_bookings: number
  location: string
  what_to_bring?: string | null
}

export async function EventsList() {
  const eventsData = await db
    .select()
    .from(events)
    .orderBy(desc(events.date), desc(events.startTime))

  const eventsList: Event[] = eventsData.map((w) => ({
    id: w.id,
    title: w.title,
    description: w.description || "",
    instructor: w.instructor,
    date: w.date,
    start_time: w.startTime,
    end_time: w.endTime,
    current_bookings: w.currentBookings,
    location: w.location || "",
    what_to_bring: w.whatToBring,
  }))

  if (eventsList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No events found. Create your first event to get started.
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `${weekday}, ${day} ${month} ${year}`
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
            <TableHead>Event</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventsList.map((event) => {
            // Combine date and start_time to properly compare datetime
            const eventDateTime = new Date(`${event.date}T${event.start_time}`)
            const isPast = eventDateTime < new Date()

            return (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/event/${createEventSlug(event.id, event.title, event.instructor)}`}
                    className="hover:underline text-primary"
                  >
                    {event.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{formatDate(event.date)}</div>
                    <div className="text-muted-foreground">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{event.location}</TableCell>
                <TableCell className="text-sm">{event.instructor}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {event.current_bookings} {event.current_bookings === 1 ? 'participant' : 'participants'}
                    </span>
                    {isPast && (
                      <Badge variant="secondary">Past</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditEventButton event={event} />
                    <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
