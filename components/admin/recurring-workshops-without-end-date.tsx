"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { startOfWeek, format } from "date-fns";
import { getRecurringWorkshopsWithoutEndDate } from "@/app/admin/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { createEventSlug } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

function getCurrentWeekMonday(): string {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

function isValidWeekDate(str: string): boolean {
  const d = new Date(str + "T00:00:00");
  return !isNaN(d.getTime());
}

export function RecurringWorkshopsWithoutEndDateSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const weekFromUrl = searchParams.get("week");
  const initialWeek =
    weekFromUrl && isValidWeekDate(weekFromUrl) ? weekFromUrl : getCurrentWeekMonday();
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [events, setEvents] = useState<
    {
      id: number;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      instructor: string | null;
      location: string | null;
      recurringSeriesId: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkshops = async (start: string) => {
    setLoading(true);
    setError(null);
    const result = await getRecurringWorkshopsWithoutEndDate(start);
    setLoading(false);
    if (result.success && result.events) {
      setEvents(result.events);
    } else {
      setError(result.error || "Failed to fetch");
      setEvents([]);
    }
  };

  // Sync state from URL when it changes (e.g. browser back/forward)
  useEffect(() => {
    const week = searchParams.get("week");
    if (week && isValidWeekDate(week) && week !== weekStart) {
      setWeekStart(week);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchWorkshops(weekStart);
  }, [weekStart]);

  const handleRefresh = () => {
    fetchWorkshops(weekStart);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setWeekStart(value);
      const params = new URLSearchParams(searchParams.toString());
      params.set("week", value);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Recurring workshops without end date
        </CardTitle>
        <CardDescription>
          Workshops in the selected week that are recurring but don&apos;t have a
          recurringUntil date set. Consider adding an end date for these events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="weekStart">Week start (Monday)</Label>
            <Input
              id="weekStart"
              type="date"
              value={weekStart}
              onChange={handleWeekChange}
              className="w-[180px]"
            />
          </div>
          <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No recurring workshops without an end date in this week.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
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
                              {formatTime(event.startTime)} -{" "}
                              {formatTime(event.endTime)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.location || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.instructor || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/event/${createEventSlug(event.id, event.title, event.instructor)}/edit`}
                            className="text-primary hover:underline text-sm"
                          >
                            Edit event
                          </Link>
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
