"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { loadMoreFeedback } from "@/app/admin/feedback/actions"
import type { Feedback } from "@/db/schema"

function FeedbackCard({ fb }: { fb: Feedback }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">
            {fb.name ?? (
              <span className="text-muted-foreground font-normal italic">
                Anonymous
              </span>
            )}
            {fb.email && (
              <a
                href={`mailto:${fb.email}`}
                className="ml-2 text-sm font-normal text-muted-foreground hover:underline"
              >
                {fb.email}
              </a>
            )}
          </CardTitle>
          <CardDescription className="text-xs shrink-0">
            {fb.createdAt.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
      </CardContent>
    </Card>
  )
}

interface FeedbackListProps {
  initialRows: Feedback[]
  initialHasMore: boolean
}

export function FeedbackList({ initialRows, initialHasMore }: FeedbackListProps) {
  const [rows, setRows] = useState(initialRows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    const oldest = rows[rows.length - 1]
    startTransition(async () => {
      const result = await loadMoreFeedback(
        new Date(oldest.createdAt).toISOString(),
      )
      setRows((prev) => [...prev, ...result.rows])
      setHasMore(result.hasMore)
    })
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No feedback yet.</p>
  }

  return (
    <div className="space-y-4">
      {rows.map((fb) => (
        <FeedbackCard key={fb.id} fb={fb} />
      ))}

      {hasMore && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}
