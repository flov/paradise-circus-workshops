"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { runExtendRecurringEvents } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

export function RunExtendRecurringEventsButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    eventsCreated?: number;
    seriesProcessed?: number;
    error?: string;
  } | null>(null);

  async function handleRun() {
    setIsRunning(true);
    setResult(null);

    try {
      const result = await runExtendRecurringEvents();

      if (result.success) {
        setResult({
          success: true,
          message: `Successfully extended recurring events`,
          eventsCreated: result.eventsCreated,
          seriesProcessed: result.seriesProcessed,
        });
        // Refresh the page to show updated data
        router.refresh();
      } else {
        setResult({
          success: false,
          error: result.error || "Failed to extend recurring events",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        error: "An unexpected error occurred",
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleRun}
        disabled={isRunning}
        className="w-full"
        variant="default"
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Extend Recurring Events
          </>
        )}
      </Button>

      {result && (
        <div
          className={`rounded-md p-3 text-sm ${
            result.success
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {result.success ? (
            <div>
              <p className="font-medium">{result.message}</p>
              {result.eventsCreated !== undefined && (
                <p className="mt-1">
                  Created {result.eventsCreated} event(s) across{" "}
                  {result.seriesProcessed} series.
                </p>
              )}
            </div>
          ) : (
            <p className="font-medium">
              Error: {result.error || "Unknown error"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
