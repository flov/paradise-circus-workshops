"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDuplicatedRecurringTitles,
  linkRecurringEventsByTitle,
  type DuplicatedRecurringTitleGroup,
} from "@/app/admin/actions";
import { Loader2, Link2, RefreshCw, CheckCircle2 } from "lucide-react";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function RecurringEventsLinkPanel() {
  const [groups, setGroups] = useState<DuplicatedRecurringTitleGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkingFor, setLinkingFor] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async (clearSuccess = false) => {
    setLoading(true);
    setError(null);
    if (clearSuccess) setSuccessMessage(null);
    const result = await getDuplicatedRecurringTitles();
    setLoading(false);
    if (result.success && result.groups !== undefined) {
      setGroups(result.groups);
    } else {
      setError(result.error || "Failed to fetch");
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLink = async (group: DuplicatedRecurringTitleGroup) => {
    setLinkingFor(group.title);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await linkRecurringEventsByTitle(group.events.map((e) => e.id));
      if (result.success && result.updated !== undefined) {
        setSuccessMessage(
          `Linked ${result.updated} event${result.updated !== 1 ? "s" : ""} for "${group.title}" into a single series.`
        );
        await fetchData();
      } else {
        setError(result.error || "Failed to link events");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLinkingFor(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-500" />
          Link Duplicate Recurring Series
        </CardTitle>
        <CardDescription>
          Find events that share the same title and instructor but have different
          recurring series IDs. Link them into a single series so they are treated
          as one recurring event.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50 p-4 text-sm text-green-800 dark:text-green-200">
            {successMessage}
          </div>
        )}

        {!loading && !error && (
          <>
            {groups === null ? null : groups.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50 p-4 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  No duplicate recurring series found. All events with the same title
                  and instructor already share the same recurring series ID.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Series IDs</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow
                        key={`${group.title}::${group.instructor ?? group.instructorId ?? "none"}`}
                      >
                        <TableCell className="font-medium">{group.title}</TableCell>
                        <TableCell className="text-sm">
                          {group.instructor ??
                            (group.instructorId ? `#${group.instructorId}` : "—")}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {group.events.map((ev) => (
                              <div
                                key={ev.id}
                                className="text-sm flex items-center gap-2"
                              >
                                <span className="text-muted-foreground">
                                  {formatDate(ev.date)} {formatTime(ev.startTime)}–
                                  {formatTime(ev.endTime)}
                                </span>
                                {ev.instructor && (
                                  <Badge variant="outline" className="text-xs">
                                    {ev.instructor}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(
                              new Set(
                                group.events.map((e) =>
                                  e.recurringSeriesId ?? "(none)"
                                )
                              )
                            ).map((sid) => (
                              <Badge
                                key={sid}
                                variant="secondary"
                                className="text-xs font-mono"
                              >
                                {sid.length > 12 ? `${sid.slice(0, 8)}…` : sid}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleLink(group)}
                            disabled={linkingFor === group.title}
                          >
                            {linkingFor === group.title ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Linking...
                              </>
                            ) : (
                              <>
                                <Link2 className="h-4 w-4 mr-2" />
                                Link {group.events.length} events
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
