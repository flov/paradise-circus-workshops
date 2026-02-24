import { db } from "@/db"
import { events, users } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditEventButton } from "./edit-event-button"
import { DeleteEventButton } from "./delete-event-button"
import { ApproveEventButton } from "./approve-event-button"
import Link from "next/link"
import { createEventSlug, isEventPast } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"

export async function PendingEventsList() {
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

  // Query only unpublished events
  // Create aliases for lastUpdatedBy and approvedBy user joins
  const lastUpdatedByUser = alias(users, "lastUpdatedByUser");
  const approvedByUser = alias(users, "approvedByUser");

  const allPendingEvents = await db
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
      currentParticipants: events.currentParticipants,
      isWorkshop: events.isWorkshop,
      isPublished: events.isPublished,
      propId: events.propId,
      isRecurring: events.isRecurring,
      recurringSeriesId: events.recurringSeriesId,
      recapVideoId: events.recapVideoId,
      createdAt: events.createdAt,
      lastUpdatedBy: events.lastUpdatedBy,
      approvedBy: events.approvedBy,
      instructorProfile: {
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        bio: users.bio,
        instagramHandle: users.instagramHandle,
        youtubeVideos: users.youtubeVideos,
        vimeoVideos: users.vimeoVideos,
        experienceStartDate: users.experienceStartDate,
        performanceStyle: users.performanceStyle,
        availableForPerformances: users.availableForPerformances,
        location: users.location,
      },
      lastUpdatedByUser: {
        id: lastUpdatedByUser.id,
        username: lastUpdatedByUser.username,
        displayName: lastUpdatedByUser.displayName,
      },
      approvedByUser: {
        id: approvedByUser.id,
        username: approvedByUser.username,
        displayName: approvedByUser.displayName,
      },
    })
    .from(events)
    .leftJoin(users, eq(events.instructorId, users.id))
    .leftJoin(lastUpdatedByUser, eq(events.lastUpdatedBy, lastUpdatedByUser.id))
    .leftJoin(approvedByUser, eq(events.approvedBy, approvedByUser.id))
    .where(eq(events.isPublished, false))
    .orderBy(desc(events.date), desc(events.startTime))

  // Filter out past events (events that have already ended)
  const pendingEvents = allPendingEvents.filter((event) => {
    return !isEventPast(event.date, event.endTime)
  })

  if (pendingEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending events awaiting approval.
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
          {pendingEvents.map((event) => {
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
                      href={`/artists/${event.instructorProfile.username}`}
                      className="text-primary hover:underline"
                    >
                      {event.instructorProfile.displayName || event.instructorProfile.username}
                    </Link>
                  ) : (
                    event.instructor || ''
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {event.currentParticipants} {event.currentParticipants === 1 ? 'participant' : 'participants'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {userProfile?.isAdmin && (
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
                          instructorId: event.instructorId ?? null,
                          date: event.date,
                          startTime: event.startTime,
                          endTime: event.endTime,
                          location: event.location,
                          whatToBring: event.whatToBring,
                          isWorkshop: event.isWorkshop,
                          isPublished: event.isPublished,
                          propId: event.propId,
                          isRecurring: event.isRecurring,
                          createdAt: event.createdAt,
                          lastUpdatedBy: event.lastUpdatedBy ?? null,
                          lastUpdatedByUser: event.lastUpdatedBy && event.lastUpdatedByUser?.id
                            ? {
                                id: event.lastUpdatedByUser.id,
                                username: event.lastUpdatedByUser.username || "",
                                displayName: event.lastUpdatedByUser.displayName,
                              }
                            : null,
                          approvedBy: event.approvedBy ?? null,
                          approvedByUser: event.approvedBy && event.approvedByUser?.id
                            ? {
                                id: event.approvedByUser.id,
                                username: event.approvedByUser.username || "",
                                displayName: event.approvedByUser.displayName,
                              }
                            : null,
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
