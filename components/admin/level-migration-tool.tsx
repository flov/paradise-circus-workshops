"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  findEventsWithLevelInTitle,
  updateEventLevel,
  updateAllEventLevels,
} from "@/app/admin/actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Match = {
  id: number;
  currentTitle: string;
  newTitle: string;
  detectedLevel: string;
  currentLevel: string;
};

export function LevelMigrationTool() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await findEventsWithLevelInTitle();
      setMatches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleUpdate = async (id: number) => {
    setUpdatingId(id);
    setResult(null);
    try {
      const res = await updateEventLevel(id);
      if (res.success) {
        setMatches((prev) => prev.filter((m) => m.id !== id));
        setResult({ message: `Updated event #${id}`, success: true });
      } else {
        setResult({ message: res.error || "Failed to update", success: false });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateAll = async () => {
    setUpdatingAll(true);
    setResult(null);
    try {
      const res = await updateAllEventLevels();
      if (res.success) {
        setResult({ message: `Updated ${res.updated} event(s)`, success: true });
        setMatches([]);
      } else {
        setResult({ message: res.error || "Failed to update", success: false });
      }
    } finally {
      setUpdatingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Scanning events...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {matches.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center">
          No events found with level keywords in their title.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">Current Title</th>
                  <th className="pb-2 pr-4 font-medium">New Title</th>
                  <th className="pb-2 pr-4 font-medium">Detected Level</th>
                  <th className="pb-2 pr-4 font-medium">Current Level</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id} className="border-b">
                    <td className="py-2 pr-4">{match.currentTitle}</td>
                    <td className="py-2 pr-4 text-green-600 dark:text-green-400">
                      {match.newTitle}
                    </td>
                    <td className="py-2 pr-4">{match.detectedLevel}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {match.currentLevel}
                    </td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdate(match.id)}
                        disabled={updatingId === match.id || updatingAll}
                      >
                        {updatingId === match.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleUpdateAll} disabled={updatingAll || updatingId !== null}>
              {updatingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating all...
                </>
              ) : (
                `Update All (${matches.length})`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
