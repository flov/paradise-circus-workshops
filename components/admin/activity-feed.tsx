"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Copy,
  Link as LinkIcon,
  CalendarPlus,
} from "lucide-react";
import { loadMoreActivity } from "@/app/admin/activity/actions";
import type { ActivityLog } from "@/db/schema";

// --- Constants ---

const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof Plus;
    badgeVariant: "default" | "secondary" | "destructive" | "outline" | "pink" | "purple" | "amber";
  }
> = {
  create: { label: "created", icon: Plus, badgeVariant: "default" },
  update: { label: "updated", icon: Pencil, badgeVariant: "secondary" },
  delete: { label: "deleted", icon: Trash2, badgeVariant: "destructive" },
  approve: { label: "approved", icon: CheckCircle, badgeVariant: "purple" },
  copy: { label: "copied to next week", icon: Copy, badgeVariant: "amber" },
  fill: { label: "filled gaps", icon: CalendarPlus, badgeVariant: "amber" },
  link: { label: "linked", icon: LinkIcon, badgeVariant: "pink" },
};

// --- Helpers ---

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EntryIcon({ action }: { action: string }) {
  const config = ACTION_CONFIG[action];
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_CONFIG[action];
  if (!config) return <Badge variant="outline">{action}</Badge>;
  return <Badge variant={config.badgeVariant}>{config.label}</Badge>;
}

function ActorName({ name, entry }: { name: string; entry: ActivityLog }) {
  const meta = entry.metadata as Record<string, unknown> | null;
  const username = meta?.actorUsername as string | undefined;
  if (username) {
    return (
      <Link href={`/artists/${username}`} className="font-medium hover:underline">
        {name}
      </Link>
    );
  }
  return <span className="font-medium">{name}</span>;
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const config = ACTION_CONFIG[log.action];
  const meta = log.metadata as Record<string, unknown> | null;
  const count = meta?.count as number | undefined;
  const field = meta?.field as string | undefined;

  const details: string[] = [];
  if (count && count > 1) details.push(`${count} events`);
  if (field) details.push(field);

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
      <TableCell className="text-muted-foreground text-xs">
        {details.length > 0 ? details.join(" · ") : "—"}
      </TableCell>
    </TableRow>
  );
}

// --- Main component ---

interface ActivityFeedProps {
  initialLogs?: ActivityLog[];
  initialHasMore?: boolean;
}

export function ActivityFeed({ initialLogs, initialHasMore }: ActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs ?? []);
  const [hasMore, setHasMore] = useState(initialHasMore ?? false);
  const [loaded, setLoaded] = useState(!!initialLogs);
  const [isPending, startTransition] = useTransition();
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    if (loaded) return;
    startTransition(async () => {
      const result = await loadMoreActivity(new Date("2099-01-01").toISOString());
      setLogs(result.logs);
      setHasMore(result.hasMore);
      setLoaded(true);
    });
  }, [loaded]);

  function handleLoadMore() {
    if (logs.length === 0) return;
    const oldest = logs[logs.length - 1];
    startTransition(async () => {
      const result = await loadMoreActivity(
        new Date(oldest.createdAt).toISOString(),
      );
      setLogs((prev) => [...prev, ...result.logs]);
      setHasMore(result.hasMore);
    });
  }

  const filteredLogs =
    actionFilter === "all"
      ? logs
      : logs.filter((l) => l.action === actionFilter);

  if (!loaded) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading activity...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="copy">Copy</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="link">Link</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No activity yet.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
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
    </div>
  );
}
