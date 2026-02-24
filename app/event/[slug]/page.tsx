import { db } from "@/db"
import {
  events,
  participations,
  comments,
  props,
  users,
  type Event,
} from "@/db/schema"
import { eq, asc, and } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { ParticipateButton } from "@/components/participate-button"
import { CancelParticipationButton } from "@/components/cancel-participation-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  UserCheck,
  Repeat,
} from "lucide-react"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isEventPast, parseEventSlug, createEventSlug } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarStack } from "@/components/avatar-stack"
import { getInitials } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { EventCalendarButtons } from "@/components/event-calendar-buttons"
import { EventComments } from "@/components/event-comments"
import { AddRecapVideo } from "@/components/add-recap-video"

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Parse the slug to extract the event ID
  const eventId = parseEventSlug(slug)

  if (!eventId) {
    notFound()
  }

  const getEventData = unstable_cache(
    async (id: number) => {
      const results = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          instructor: events.instructor,
          instructorId: events.instructorId,
          date: events.date,
          startTime: events.startTime,
          endTime: events.endTime,
          maxCapacity: events.maxCapacity,
          currentParticipants: events.currentParticipants,
          location: events.location,
          whatToBring: events.whatToBring,
          isWorkshop: events.isWorkshop,
          propId: events.propId,
          recapVideoId: events.recapVideoId,
          isRecurring: events.isRecurring,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          instructorProfile: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            avatarImageUrl: users.avatarImageUrl,
            bio: users.bio,
            instagramHandle: users.instagramHandle,
            youtubeVideos: users.youtubeVideos,
            vimeoVideos: users.vimeoVideos,
            experienceStartDate: users.experienceStartDate,
            performanceStyle: users.performanceStyle,
            availableForPerformances: users.availableForPerformances,
            location: users.location,
          },
        })
        .from(events)
        .leftJoin(users, eq(events.instructorId, users.id))
        .where(and(eq(events.id, id), eq(events.isPublished, true)))
      if (results.length === 0) return null
      const eventResult = results[0]
      let eventProp: { id: number; name: string } | null = null
      if (eventResult.propId) {
        const propResults = await db
          .select({ id: props.id, name: props.name })
          .from(props)
          .where(eq(props.id, eventResult.propId))
          .limit(1)
        if (propResults.length > 0) eventProp = propResults[0]
      }
      return { eventResult, eventProp }
    },
    [`event-${eventId}`],
    { revalidate: 300, tags: ["events", `event-${eventId}`] },
  )

  const cached = await getEventData(eventId)
  if (!cached) notFound()
  const { eventResult, eventProp } = cached

  const event = {
    id: eventResult.id,
    title: eventResult.title,
    description: eventResult.description,
    instructor: eventResult.instructor,
    instructorId: eventResult.instructorId,
    date: eventResult.date,
    startTime: eventResult.startTime,
    endTime: eventResult.endTime,
    maxCapacity: eventResult.maxCapacity,
    currentParticipants: eventResult.currentParticipants,
    location: eventResult.location,
    whatToBring: eventResult.whatToBring,
    isWorkshop: eventResult.isWorkshop,
    propId: eventResult.propId,
    recapVideoId: eventResult.recapVideoId,
    isRecurring: eventResult.isRecurring,
    createdAt: eventResult.createdAt,
    updatedAt: eventResult.updatedAt,
  }

  // Get instructor display name from joined profile
  const instructorDisplayName =
    eventResult.instructorProfile?.displayName ||
    eventResult.instructorProfile?.username ||
    null

  // If the slug is in old format (numeric only), redirect to new format for SEO
  if (/^\d+$/.test(slug)) {
    const instructorName = instructorDisplayName || event.instructor || ""
    const newSlug = createEventSlug(event.id, event.title, instructorName)
    redirect(`/event/${newSlug}`)
  }

  // Format date
  const date = new Date(event.date)
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

  const isPast = isEventPast(event.date, event.endTime)

  // Get user data and fetch participations/comments in parallel to minimize CPU time
  const { userId } = await auth()

  const getParticipations = unstable_cache(
    async (id: number) => {
      return db
        .select({
          id: participations.id,
          participantName: participations.participantName,
          participantEmail: participations.participantEmail,
          clerkUserId: participations.clerkUserId,
          avatarImageUrl: users.avatarImageUrl,
        })
        .from(participations)
        .leftJoin(users, eq(participations.clerkUserId, users.clerkUserId))
        .where(eq(participations.eventId, id))
    },
    [`event-${eventId}-participations`],
    { revalidate: 60, tags: [`event-${eventId}-participations`] },
  )

  const getComments = unstable_cache(
    async (id: number) => {
      return db
        .select({
          id: comments.id,
          authorName: comments.authorName,
          authorImageUrl: comments.authorImageUrl,
          content: comments.content,
          createdAt: comments.createdAt,
          clerkUserId: comments.clerkUserId,
        })
        .from(comments)
        .where(eq(comments.eventId, id))
        .orderBy(asc(comments.createdAt))
    },
    [`event-${eventId}-comments`],
    { revalidate: 60, tags: [`event-${eventId}-comments`] },
  )

  // Fetch user profile (only if authenticated), participations, and comments in parallel
  const [userProfileResult, participationsData, commentsData] =
    await Promise.all([
      userId
        ? db
            .select({
              displayName: users.displayName,
              email: users.email,
              avatarImageUrl: users.avatarImageUrl,
            })
            .from(users)
            .where(eq(users.clerkUserId, userId))
            .limit(1)
        : Promise.resolve([]),
      getParticipations(eventId),
      getComments(eventId),
    ])

  const userProfile = userProfileResult[0]
  const initialUserName = userProfile?.displayName ?? ""
  const initialUserEmail = userProfile?.email ?? ""
  const currentUserImageUrl = userProfile?.avatarImageUrl ?? null

  const userParticipationId = userId
    ? (participationsData.find((p) => p.clerkUserId === userId)?.id ?? null)
    : null

  const participants = participationsData.map((participation) => ({
    name: participation.participantName,
    email: participation.participantEmail,
    imageUrl: participation.avatarImageUrl || null,
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/timetable">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Timetable
              </Button>
            </Link>
            <h1 className="text-1xl font-bold text-foreground text-balance">
              Join This Event
            </h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          {/* Event Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-2xl text-balance">
                  {event.title}
                </CardTitle>
                {isPast && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground shrink-0"
                  >
                    Past Event
                  </Badge>
                )}
              </div>
              <CardDescription className="text-pretty">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{event.description}</ReactMarkdown>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metadata grid: 1 col on mobile, 2 cols on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex items-center gap-3 text-sm">
                  {eventResult.instructorProfile ? (
                    eventResult.instructorProfile.username ? (
                      <Link
                        href={`/artists/${eventResult.instructorProfile.username}`}
                        className="rounded-full shrink-0"
                      >
                        <Avatar className="size-10">
                          <AvatarImage
                            src={
                              eventResult.instructorProfile.avatarImageUrl ??
                              undefined
                            }
                            alt={
                              instructorDisplayName ||
                              event.instructor ||
                              "Instructor"
                            }
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(
                              instructorDisplayName || event.instructor || "?",
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage
                          src={
                            eventResult.instructorProfile.avatarImageUrl ??
                            undefined
                          }
                          alt={
                            instructorDisplayName ||
                            event.instructor ||
                            "Instructor"
                          }
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(
                            instructorDisplayName || event.instructor || "?",
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )
                  ) : (
                    <Users className="h-5 w-5 text-primary shrink-0" />
                  )}
                  <div>
                    <div className="font-medium text-foreground">
                      Instructor
                    </div>
                    {eventResult.instructorProfile?.username ? (
                      <Link
                        href={`/artists/${eventResult.instructorProfile.username}`}
                        className="text-primary hover:underline"
                      >
                        {instructorDisplayName || event.instructor || "Unknown"}
                      </Link>
                    ) : (
                      <div className="text-muted-foreground">
                        {instructorDisplayName || event.instructor || "Unknown"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Date</div>
                    <div className="text-muted-foreground">{formattedDate}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Time</div>
                    <div className="text-muted-foreground">
                      {formatTime(event.startTime)} -{" "}
                      {formatTime(event.endTime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Location</div>
                    <div className="text-muted-foreground">
                      {event.location}
                    </div>
                  </div>
                </div>

                {eventProp && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="h-5 w-5 text-primary mt-0.5">🎪</div>
                    <div>
                      <div className="font-medium text-foreground">Prop</div>
                      <div className="text-muted-foreground mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {eventProp.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <UserCheck className="h-5 w-5 text-primary shrink-0" />
                  <div className="font-medium text-foreground">
                    {event.currentParticipants}{" "}
                    {event.currentParticipants === 1
                      ? "Participant"
                      : "Participants"}
                  </div>
                  {participants.length > 0 && (
                    <AvatarStack participants={participants} size="sm" />
                  )}
                </div>

                {event.isRecurring && (
                  <div className="flex items-center gap-3 text-sm">
                    <Repeat className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-muted-foreground">Recurring Event</div>
                  </div>
                )}
              </div>

              {/* Full-width actions */}
              <div className="space-y-3">
                <EventCalendarButtons
                  eventData={{
                    title: event.title,
                    date: event.date,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    location: event.location,
                    instructor:
                      instructorDisplayName || event.instructor || "",
                    description: event.description,
                    whatToBring: event.whatToBring || null,
                    bookingId: event.id,
                    confirmationToken: `event-${createEventSlug(
                      event.id,
                      event.title,
                      instructorDisplayName || event.instructor || "",
                    )}`,
                  }}
                  className="w-full"
                />
                {userParticipationId ? (
                  <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      ✓ You are participating in this event
                    </p>
                    <CancelParticipationButton
                      participationId={userParticipationId}
                      variant="outline"
                    />
                  </div>
                ) : (
                  <ParticipateButton
                    eventId={event.id}
                    isPast={isPast}
                    isAuthenticated={!!userId}
                    userName={initialUserName}
                    userEmail={initialUserEmail}
                  />
                )}
              </div>

              {/* Add Recap Video Section - Only for past workshops without recap */}
              {isPast && event.isWorkshop && !event.recapVideoId && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Workshop Recap
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Did you make a recap of the workshop? Add a YouTube video
                      ID here.
                    </p>
                    <AddRecapVideo
                      eventId={event.id}
                      currentRecapVideoId={event.recapVideoId}
                    />
                  </div>
                </div>
              )}

              {/* Recap Video Section - Show video if it exists */}
              {event.recapVideoId && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-foreground">
                    Workshop Recap
                  </h3>
                  <div className="aspect-video w-full rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${event.recapVideoId}`}
                      title="Workshop Recap Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  {isPast && event.isWorkshop && (
                    <div className="mt-2">
                      <AddRecapVideo
                        eventId={event.id}
                        currentRecapVideoId={event.recapVideoId}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Section */}
              <EventComments
                eventId={event.id}
                comments={commentsData}
                currentUserId={userId}
                currentUserName={initialUserName}
                currentUserImageUrl={currentUserImageUrl}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
