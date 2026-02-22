"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ACTIVITY_ACTION_CONFIG,
  ACTIVITY_ACTION_FILTER_OPTIONS,
} from "@/lib/activity-config"
import { ACTIVITY_INITIAL_CURSOR } from "@/lib/activity-config"
import { loadMoreActivity } from "@/app/admin/activity/actions"
import type { ActivityLog } from "@/db/schema"

// --- Helpers ---

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function EntryIcon({ action }: { action: string }) {
  const config = ACTIVITY_ACTION_CONFIG[action]
  if (!config) return null
  const Icon = config.icon
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
}

function ActionBadge({ action }: { action: string }) {
  const config = ACTIVITY_ACTION_CONFIG[action]
  if (!config) return <Badge variant="outline">{action}</Badge>
  return <Badge variant={config.badgeVariant}>{config.label}</Badge>
}

function ActorName({ name, entry }: { name: string; entry: ActivityLog }) {
  const meta = entry.metadata as Record<string, unknown> | null
  const username = meta?.actorUsername as string | undefined
  if (username) {
    return (
      <Link
        href={`/artists/${username}`}
        className="font-medium hover:underline"
      >
        {name}
      </Link>
    )
  }
  return <span className="font-medium">{name}</span>
}

function formatActivityDetails(
  metadata: Record<string, unknown> | null,
): string {
  if (!metadata) return "—"
  const parts: string[] = []
  const count = metadata.count as number | undefined
  const field = metadata.field as string | undefined
  const changedFields = metadata.changedFields as string[] | undefined

  if (count && count > 1) parts.push(`${count} events`)
  if (field) parts.push(field)
  if (changedFields?.length) parts.push(changedFields.join(", "))

  return parts.length > 0 ? parts.join(" · ") : "—"
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const meta = log.metadata as Record<string, unknown> | null
  const details = formatActivityDetails(meta)

  return (
    <TableRow>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(new Date(log.createdAt))}
      </TableCell>
      <TableCell>
        <ActorName name={log.actorName} entry={log} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <EntryIcon action={log.action} />
          <ActionBadge action={log.action} />
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{log.entityType}</TableCell>
      <TableCell className="max-w-[280px] whitespace-normal break-words">
        {log.entityLabel ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">{details}</TableCell>
    </TableRow>
  )
}

// --- Main component ---

interface ActivityFeedProps {
  initialLogs?: ActivityLog[]
  initialHasMore?: boolean
}

export function ActivityFeed({
  initialLogs,
  initialHasMore,
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs ?? [])
  const [hasMore, setHasMore] = useState(initialHasMore ?? false)
  const [loaded, setLoaded] = useState(!!initialLogs)
  const [isPending, startTransition] = useTransition()
  const [actionFilter, setActionFilter] = useState<string>("all")

  useEffect(() => {
    if (loaded) return
    startTransition(async () => {
      const result = await loadMoreActivity(ACTIVITY_INITIAL_CURSOR)
      setLogs(result.logs)
      setHasMore(result.hasMore)
      setLoaded(true)
    })
  }, [loaded])

  function handleLoadMore() {
    if (logs.length === 0) return
    const oldest = logs[logs.length - 1]
    startTransition(async () => {
      const result = await loadMoreActivity(
        new Date(oldest.createdAt).toISOString(),
      )
      setLogs((prev) => [...prev, ...result.logs])
      setHasMore(result.hasMore)
    })
  }

  const filteredLogs =
    actionFilter === "all"
      ? logs
      : logs.filter((l) => l.action === actionFilter)

  if (!loaded) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          Loading activity...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTIVITY_ACTION_FILTER_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No activity yet.
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <ActivityRow key={log.id} log={log} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isPending}
            >
              {isPending ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
