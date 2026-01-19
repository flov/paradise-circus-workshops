import { db } from "@/db"
import { events, users } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditEventButton } from "./edit-event-button"
import { DeleteEventButton } from "./delete-event-button"
import { ApproveEventButton } from "./approve-event-button"
import Link from "next/link"
import { createEventSlug } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"

export async function EventsList() {
  const { userId } = await auth()
  
  // Get current user profile to check permissions
  let userProfile: { id: number; username: string | null; isAdmin: boolean; isInstructor: boolean } | null = null
  if (userId) {
    const result = await db
      .select({ id: users.id, username: users.username, isAdmin: users.isAdmin, isInstructor: users.isInstructor })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)
    if (result.length > 0) {
      userProfile = result[0]
    }
  }

  const eventsList = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      instructor: events.instructor,
      instructorId: events.instructorId,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      location: events.location,
      currentBookings: events.currentBookings,
      isWorkshop: events.isWorkshop,
      isPublished: events.isPublished,
      propId: events.propId,
      isRecurring: events.isRecurring,
      recurringSeriesId: events.recurringSeriesId,
      instructorProfile: {
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        bio: users.bio,
        instagramHandle: users.instagramHandle,
        youtubeVideos: users.youtubeVideos,
        experienceStartDate: users.experienceStartDate,
        performanceStyle: users.performanceStyle,
        availableForPerformances: users.availableForPerformances,
        location: users.location,
      },
    })
    .from(events)
    .leftJoin(users, eq(events.instructorId, users.id))
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
            <TableHead>Status</TableHead>
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
                <TableCell className="text-sm">
                  {event.instructorProfile?.username ? (
                    <Link
                      href={`/artist/${event.instructorProfile.username}`}
                      className="text-primary hover:underline"
                    >
                      {event.instructorProfile.displayName || event.instructorProfile.username}
                    </Link>
                  ) : (
                    event.instructor || ''
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.isPublished ? (
                      <Badge variant="default">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {event.isRecurring && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        Recurring
                      </Badge>
                    )}
                    {isPast && (
                      <Badge variant="outline">Past</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {event.currentBookings} {event.currentBookings === 1 ? 'participant' : 'participants'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!event.isPublished && userProfile?.isAdmin && (
                      <ApproveEventButton eventId={event.id} />
                    )}
                    {userProfile && (userProfile.isAdmin || (userProfile.isInstructor && (
                      (event.instructorId !== null && event.instructorId === userProfile.id) || 
                      (event.instructorId === null && event.instructor === userProfile.username)
                    ))) && (
                      <>
                        <EditEventButton event={{
                          id: event.id,
                          title: event.title,
                          description: event.description,
                          instructor: event.instructor,
                          instructorId: event.instructorId || undefined,
                          date: event.date,
                          startTime: event.startTime,
                          endTime: event.endTime,
                          location: event.location,
                          whatToBring: event.whatToBring,
                          isWorkshop: event.isWorkshop,
                          isPublished: event.isPublished,
                          propId: event.propId,
                        }} />
                        <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                      </>
                    )}
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
