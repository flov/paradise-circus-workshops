"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Activity, Edit3, UserPlus, MessageSquare } from "lucide-react"
import Link from "next/link"
import type { RecentActivityItem } from "@/app/admin/stats"

interface RecentActivityFeedProps {
  items: RecentActivityItem[]
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Activity Feed</CardTitle>
        </div>
        <CardDescription>
          Event edits, new bookings, and comments from the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No recent activity
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const eventLink = `/event/${item.eventSlug}/edit`
              const eventViewLink = `/event/${item.eventSlug}`

              if (item.type === "event_updated") {
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Edit3 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <Link
                          href={eventLink}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.eventTitle}
                        </Link>{" "}
                        <span className="text-muted-foreground">
                          was updated by {item.actorName}
                          {item.actorSource === "recurring_creator" && (
                            <span className="italic">
                              {" "}
                              (recurring event creator)
                            </span>
                          )}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Event date: {item.eventDate} ·{" "}
                        {formatRelativeTime(item.occurredAt)}
                      </p>
                    </div>
                  </li>
                )
              }

              if (item.type === "booking") {
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <UserPlus className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          New booking for{" "}
                        </span>
                        <Link
                          href={eventViewLink}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.eventTitle}
                        </Link>
                        <span className="text-muted-foreground">
                          {" "}
                          by {item.participantName}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Event date: {item.eventDate} ·{" "}
                        {formatRelativeTime(item.occurredAt)}
                      </p>
                    </div>
                  </li>
                )
              }

              if (item.type === "comment") {
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          New comment on{" "}
                        </span>
                        <Link
                          href={eventViewLink}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.eventTitle}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Event date: {item.eventDate} ·{" "}
                        {formatRelativeTime(item.occurredAt)}
                      </p>
                    </div>
                  </li>
                )
              }

              return null
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
