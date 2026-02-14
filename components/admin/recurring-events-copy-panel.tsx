"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getRecurringEventsCopyCandidates,
  copyRecurringEventsAction,
} from "@/app/admin/actions";
import { Loader2 } from "lucide-react";

interface CandidateEvent {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  instructor: string | null;
  location: string | null;
  recurringSeriesId: string | null;
}

interface CopyResult {
  success: boolean;
  copied?: number;
  skipped?: number;
  skippedItems?: Array<{ eventId: number; reason: string }>;
  error?: string;
}

// Helper function to get default date range (current and previous week)
function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  
  // Calculate current week Monday
  const dayOfWeek = todayUTC.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const currentWeekMonday = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() - daysSinceMonday));
  
  // Calculate current week Sunday
  const currentWeekSunday = new Date(Date.UTC(currentWeekMonday.getUTCFullYear(), currentWeekMonday.getUTCMonth(), currentWeekMonday.getUTCDate() + 6));
  
  // Calculate previous week Monday (7 days before current week Monday)
  const previousWeekMonday = new Date(Date.UTC(currentWeekMonday.getUTCFullYear(), currentWeekMonday.getUTCMonth(), currentWeekMonday.getUTCDate() - 7));
  
  // Format as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  return {
    dateFrom: formatDate(previousWeekMonday),
    dateTo: formatDate(currentWeekSunday),
  };
}

export function RecurringEventsCopyPanel() {
  const defaultRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState<string>(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState<string>(defaultRange.dateTo);
  const [candidates, setCandidates] = useState<CandidateEvent[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<CopyResult | null>(null);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleFindCandidates = async () => {
    if (!dateFrom || !dateTo) {
      setResult({ success: false, error: "Please select both start and end dates" });
      return;
    }
    
    if (dateFrom > dateTo) {
      setResult({ success: false, error: "Start date must be before end date" });
      return;
    }

    setIsLoadingCandidates(true);
    setResult(null);
    try {
      const response = await getRecurringEventsCopyCandidates(dateFrom, dateTo);
      if (response.success && response.events) {
        setCandidates(response.events);
        // Pre-check all events by default
        setSelectedIds(new Set(response.events.map((e) => e.id)));
      } else {
        setCandidates([]);
        setResult({ success: false, error: response.error || "Failed to fetch candidates" });
      }
    } catch (error) {
      setCandidates([]);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleToggleSelection = (eventId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedIds(newSelected);
  };

  const handleCopyEvents = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      return;
    }

    setIsCopying(true);
    setResult(null);

    const formData = new FormData();
    selectedIds.forEach((id) => {
      formData.append("selectedEventIds", id.toString());
    });

    try {
      const response = await copyRecurringEventsAction(formData);
      setResult(response);
      if (response.success && dateFrom && dateTo) {
        // Refresh candidates after successful copy using current date range
        setIsLoadingCandidates(true);
        try {
          const refreshResponse = await getRecurringEventsCopyCandidates(dateFrom, dateTo);
          if (refreshResponse.success && refreshResponse.events) {
            setCandidates(refreshResponse.events);
            setSelectedIds(new Set(refreshResponse.events.map((e) => e.id)));
          }
        } catch (refreshError) {
          // Silently fail refresh, user can manually refresh if needed
          console.error("Error refreshing candidates:", refreshError);
        } finally {
          setIsLoadingCandidates(false);
        }
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsCopying(false);
    }
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Date From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={isLoadingCandidates || isCopying}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Date To</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={isLoadingCandidates || isCopying}
            />
          </div>
          <div>
            <Button
              onClick={handleFindCandidates}
              disabled={isLoadingCandidates || isCopying || !dateFrom || !dateTo}
              type="button"
            >
              {isLoadingCandidates ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding events...
                </>
              ) : (
                "Find recurring events to copy"
              )}
            </Button>
          </div>
        </div>
        {candidates !== null && (
          <div className="text-sm text-muted-foreground">
            Found {candidates.length} event{candidates.length !== 1 ? "s" : ""}
            {candidates.length > 0 && (
              <span className="ml-2">
                • {selectedIds.size} selected
              </span>
            )}
          </div>
        )}
      </div>

      {candidates !== null && candidates.length > 0 && (
        <form onSubmit={handleCopyEvents}>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        candidates.length > 0 &&
                        selectedIds.size === candidates.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(candidates.map((c) => c.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Instructor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(event.id)}
                        onChange={() => handleToggleSelection(event.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
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
                      {event.location || (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.instructor || (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button
              type="submit"
              disabled={selectedIds.size === 0 || isCopying}
            >
              {isCopying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Copying events...
                </>
              ) : (
                `Copy ${selectedIds.size} event${selectedIds.size !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </form>
      )}

      {candidates !== null && candidates.length === 0 && !result?.error && (
        <div className="text-center py-8 text-muted-foreground">
          No recurring events found in the selected date range.
        </div>
      )}

      {result && (
        <div
          className={`p-4 rounded-md ${
            result.success
              ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
          }`}
        >
          {result.success ? (
            <div className="space-y-2">
              <div className="font-medium text-green-900 dark:text-green-100">
                Copy completed successfully!
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                <div>Copied: {result.copied || 0} event(s)</div>
                {result.skipped && result.skipped > 0 && (
                  <div>Skipped: {result.skipped} event(s) (duplicates)</div>
                )}
                {result.skippedItems &&
                  result.skippedItems.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Skipped items:</div>
                      <ul className="list-disc list-inside mt-1">
                        {result.skippedItems.map((item) => (
                          <li key={item.eventId}>
                            Event #{item.eventId}: {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="text-red-900 dark:text-red-100">
              <div className="font-medium">Error</div>
              <div className="text-sm mt-1">{result.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
