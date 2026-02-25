import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, Repeat } from "lucide-react"
import Link from "next/link"
import { isEventPast, createEventSlug } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import type { Event } from "@/db/schema"

export function EventCard({ event, instructorDisplayName }: { event: Pick<Event, "id" | "title" | "description" | "instructor" | "date" | "startTime" | "endTime" | "currentParticipants" | "location" | "isRecurring" | "isWorkshop" | "level">, instructorDisplayName?: string | null }) {
  const isPast = isEventPast(event.date, event.endTime)

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

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-xl text-balance">{event.title}</CardTitle>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isPast && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                Past Event
              </Badge>
            )}
            {event.isWorkshop && (
              <Badge
                variant="secondary"
                className={`text-xs ${event.level === "Beginner" ? "bg-green-500/20 text-green-700 dark:text-green-400" : event.level === "Intermediate" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" : event.level === "Advanced" ? "bg-red-500/20 text-red-700 dark:text-red-400" : "bg-muted text-muted-foreground"}`}
              >
                {event.level}
              </Badge>
            )}
            <Badge variant="outline">
              {event.currentParticipants} {event.currentParticipants === 1 ? 'participant' : 'participants'}
            </Badge>
            {event.isRecurring && (
              <Badge variant="outline" className="text-xs">
                <Repeat className="h-3 w-3 mr-1" />
                Recurring
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-pretty">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{event.description}</ReactMarkdown>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{event.location}</span>
          </div>
        </div>

        {isPast ? (
          <div className="mt-auto">
            <Button className="w-full" disabled>
              Event Ended
            </Button>
          </div>
        ) : (
          <Link href={`/event/${createEventSlug(event.id, event.title, instructorDisplayName || event.instructor || '')}`} className="mt-auto">
            <Button className="w-full">Participate</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
