import { db } from "@/db";
import { events, participations, comments, props, users, type Event } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { BookEventButton } from "@/components/book-event-button";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  UserCheck,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  isEventPast,
  getUserName,
  getUserEmail,
  parseEventSlug,
  createEventSlug,
} from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AvatarStack } from "@/components/avatar-stack";
import ReactMarkdown from "react-markdown";
import { EventCalendarButtons } from "@/components/event-calendar-buttons";
import { EventComments } from "@/components/event-comments";
import { AddRecapVideo } from "@/components/add-recap-video";

export default async function BookEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Parse the slug to extract the event ID
  const eventId = parseEventSlug(slug);

  if (!eventId) {
    notFound();
  }

  const eventResults = await db
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
      currentBookings: events.currentBookings,
      location: events.location,
      whatToBring: events.whatToBring,
      isWorkshop: events.isWorkshop,
      propId: events.propId,
      recapVideoId: events.recapVideoId,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
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
    })
    .from(events)
    .leftJoin(users, eq(events.instructorId, users.id))
    .where(and(eq(events.id, eventId), eq(events.isPublished, true)));

  if (eventResults.length === 0) {
    notFound();
  }

  const eventResult = eventResults[0];
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
    currentBookings: eventResult.currentBookings,
    location: eventResult.location,
    whatToBring: eventResult.whatToBring,
    isWorkshop: eventResult.isWorkshop,
    propId: eventResult.propId,
    recapVideoId: eventResult.recapVideoId,
    createdAt: eventResult.createdAt,
    updatedAt: eventResult.updatedAt,
  };

  // Get instructor display name from joined profile
  const instructorDisplayName = eventResult.instructorProfile?.displayName || eventResult.instructorProfile?.username || null;

  // Get event prop (single prop now)
  let eventProp: { id: number; name: string } | null = null;
  if (event.propId) {
    const propResults = await db
      .select({
        id: props.id,
        name: props.name,
      })
      .from(props)
      .where(eq(props.id, event.propId))
      .limit(1);
    
    if (propResults.length > 0) {
      eventProp = propResults[0];
    }
  }

  // If the slug is in old format (numeric only), redirect to new format for SEO
  if (/^\d+$/.test(slug)) {
    const instructorName = instructorDisplayName || event.instructor || '';
    const newSlug = createEventSlug(
      event.id,
      event.title,
      instructorName,
    );
    redirect(`/event/${newSlug}`);
  }

  // Format date
  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isPast = isEventPast(event.date, event.endTime);

  // Get user data on server side for faster loading
  const { userId } = await auth();
  let initialUserName = "";
  let initialUserEmail = "";
  let currentUserImageUrl: string | null = null;

  if (userId) {
    const user = await currentUser();
    if (user) {
      initialUserName = getUserName(user);
      initialUserEmail = getUserEmail(user);
    }
    
    // Get current user's profile image from database
    try {
      const userProfile = await db
        .select({ avatarImageUrl: users.avatarImageUrl })
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (userProfile.length > 0) {
        currentUserImageUrl = userProfile[0].avatarImageUrl || null;
      }
    } catch (error) {
      console.error("Failed to fetch user profile image:", error);
    }
  }

  // Fetch participations for this event with user profile images from database
  const participationsData = await db
    .select({
      id: participations.id,
      participantName: participations.participantName,
      participantEmail: participations.participantEmail,
      clerkUserId: participations.clerkUserId,
      avatarImageUrl: users.avatarImageUrl,
    })
    .from(participations)
    .leftJoin(users, eq(participations.clerkUserId, users.clerkUserId))
    .where(eq(participations.eventId, eventId));

  // Check if current user has a participation and get the participationId
  let userParticipationId: number | null = null;
  if (userId) {
    const userParticipation = participationsData.find(
      (participation) => participation.clerkUserId === userId,
    );
    if (userParticipation) {
      userParticipationId = userParticipation.id;
    }
  }

  // Map participations to participants with database avatar images
  const participants = participationsData.map((participation) => ({
    name: participation.participantName,
    email: participation.participantEmail,
    imageUrl: participation.avatarImageUrl || null,
  }));

  // Fetch comments for this event
  const commentsData = await db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      authorImageUrl: comments.authorImageUrl,
      content: comments.content,
      createdAt: comments.createdAt,
      clerkUserId: comments.clerkUserId,
    })
    .from(comments)
    .where(eq(comments.eventId, eventId))
    .orderBy(asc(comments.createdAt));

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
              Book Your Event
            </h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          {/* Event Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-2xl text-balance">
                  {event.title}
                </CardTitle>
                {isPast && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
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
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Date</div>
                    <div className="text-muted-foreground">{formattedDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Time</div>
                    <div className="text-muted-foreground">
                      {formatTime(event.startTime)} -{" "}
                      {formatTime(event.endTime)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Location</div>
                    <div className="text-muted-foreground">
                      {event.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">
                      Instructor
                    </div>
                    {eventResult.instructorProfile?.username ? (
                      <Link
                        href={`/artists/${eventResult.instructorProfile.username}`}
                        className="text-primary hover:underline"
                      >
                        {instructorDisplayName || event.instructor || 'Unknown'}
                      </Link>
                    ) : (
                      <div className="text-muted-foreground">
                        {instructorDisplayName || event.instructor || 'Unknown'}
                      </div>
                    )}
                  </div>
                </div>
                {eventProp && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="h-5 w-5 text-primary mt-0.5">🎪</div>
                    <div>
                      <div className="font-medium text-foreground">
                        Prop
                      </div>
                      <div className="text-muted-foreground mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {eventProp.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <div className="font-medium text-foreground">
                    {event.currentBookings}{" "}
                    {event.currentBookings === 1
                      ? "Participant"
                      : "Participants"}
                  </div>
                  {participants.length > 0 && (
                    <div className="mt-1">
                      <AvatarStack participants={participants} size="sm" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <EventCalendarButtons
                    eventData={{
                      title: event.title,
                      date: event.date,
                      startTime: event.startTime,
                      endTime: event.endTime,
                      location: event.location,
                      instructor: instructorDisplayName || event.instructor || '',
                      description: event.description,
                      whatToBring: event.whatToBring || null,
                      bookingId: event.id,
                      confirmationToken: `event-${createEventSlug(
                        event.id,
                        event.title,
                        instructorDisplayName || event.instructor || ''
                      )}`,
                    }}
                    className="w-full"
                  />
                </div>
                {userParticipationId ? (
                  <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      ✓ You are participating in this event
                    </p>
                    <CancelBookingButton
                      bookingId={userParticipationId}
                      variant="outline"
                    />
                  </div>
                ) : (
                  <BookEventButton
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
                      Did you make a recap of the workshop? Add a YouTube video ID here.
                    </p>
                    <AddRecapVideo eventId={event.id} currentRecapVideoId={event.recapVideoId} />
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
                      <AddRecapVideo eventId={event.id} currentRecapVideoId={event.recapVideoId} />
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
  );
}
