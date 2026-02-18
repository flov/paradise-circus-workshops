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
  getRecurringEventsWithGaps,
  fillRecurringSeriesGaps,
  type RecurringSeriesWithGaps,
} from "@/app/admin/actions";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Plus } from "lucide-react";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export function RecurringEventsGapsCard() {
  const [seriesWithGaps, setSeriesWithGaps] = useState<RecurringSeriesWithGaps[] | null>(null);
  const [totalSeries, setTotalSeries] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async (clearSuccess = false) => {
    setLoading(true);
    setError(null);
    if (clearSuccess) setSuccessMessage(null);
    const result = await getRecurringEventsWithGaps();
    setLoading(false);
    if (result.success && result.seriesWithGaps !== undefined) {
      setSeriesWithGaps(result.seriesWithGaps);
      setTotalSeries(result.totalSeriesWithRecurringUntil ?? 0);
    } else {
      setError(result.error || "Failed to fetch");
      setSeriesWithGaps([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMissing = async (series: RecurringSeriesWithGaps) => {
    setCreatingFor(series.recurringSeriesId);
    setError(null);
    try {
      const result = await fillRecurringSeriesGaps(
        series.recurringSeriesId,
        series.missingWeeks,
        series.firstEventDate,
      );
      if (result.success && result.created !== undefined) {
        setSuccessMessage(`Created ${result.created} event${result.created !== 1 ? "s" : ""} for missing weeks.`);
        await fetchData();
      } else {
        setError(result.error || "Failed to create events");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreatingFor(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Recurring Events Coverage Check
        </CardTitle>
        <CardDescription>
          Events with a recurring_until date are checked to ensure they exist for every week
          from the first event until the end date. Series with missing weeks are listed below.
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
            {seriesWithGaps === null ? null : totalSeries === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No recurring events with an end date (recurring_until) found.
              </p>
            ) : seriesWithGaps.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50 p-4 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  All {totalSeries} recurring series with an end date have complete coverage for every week.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Events / Weeks</TableHead>
                      <TableHead>Missing Weeks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seriesWithGaps.map((series) => (
                      <TableRow key={series.recurringSeriesId}>
                        <TableCell className="font-medium">{series.title}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(series.firstEventDate)} — {formatDate(series.recurringUntil)}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {series.eventCount} events / {series.totalWeeks} weeks
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {series.missingWeeks.map((weekMonday) => (
                              <Badge key={weekMonday} variant="destructive" className="text-xs">
                                {formatDate(weekMonday)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleCreateMissing(series)}
                            disabled={creatingFor === series.recurringSeriesId}
                          >
                            {creatingFor === series.recurringSeriesId ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create {series.missingWeeks.length} missing
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
