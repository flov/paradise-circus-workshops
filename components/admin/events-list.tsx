import { db } from "@/db"
import { events, type Event } from "@/db/schema"
import { desc } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditEventButton } from "./edit-event-button"
import { DeleteEventButton } from "./delete-event-button"
import Link from "next/link"
import { createEventSlug } from "@/lib/utils"

export async function EventsList() {
  const eventsList = await db
    .select()
    .from(events)
    .orderBy(desc(events.date), desc(events.startTime))

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
            // Combine date and startTime to properly compare datetime
            const eventDateTime = new Date(`${event.date}T${event.startTime}`)
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
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{event.location}</TableCell>
                <TableCell className="text-sm">{event.instructor}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {event.currentBookings} {event.currentBookings === 1 ? 'participant' : 'participants'}
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
