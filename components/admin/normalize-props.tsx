"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { normalizeProps, findDuplicateProps } from "@/app/admin/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export function NormalizeProps() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    merged?: number;
    details?: Array<{
      canonical: string;
      merged: string[];
      canonicalId: number;
    }>;
  } | null>(null);
  const [duplicates, setDuplicates] = useState<{
    success: boolean;
    duplicates?: Array<{
      normalized: string;
      props: Array<{ id: number; name: string }>;
      suggestedCanonical: { id: number; name: string };
    }>;
    count?: number;
    totalDuplicateProps?: number;
    error?: string;
  } | null>(null);

  const handleFindDuplicates = async () => {
    setIsFinding(true);
    setResult(null);
    try {
      const response = await findDuplicateProps();
      setDuplicates(response);
    } catch (error) {
      setDuplicates({
        success: false,
        error: "Failed to find duplicates",
      });
    } finally {
      setIsFinding(false);
    }
  };

  const handleNormalize = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await normalizeProps();
      setResult(response);
      // Refresh duplicates after normalization
      if (response.success) {
        await handleFindDuplicates();
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to normalize props",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Normalize Props</CardTitle>
        <CardDescription>
          Find and merge duplicate prop entries. Duplicates are identified by
          normalizing names (removing spaces, lowercasing). For example,
          &quot;contactstaff&quot; and &quot;contact staff&quot; will be merged
          into &quot;contact staff&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleFindDuplicates}
            disabled={isFinding || isLoading}
            variant="outline"
          >
            {isFinding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finding...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Find Duplicates
              </>
            )}
          </Button>
          <Button
            onClick={handleNormalize}
            disabled={isLoading || isFinding}
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Normalizing...
              </>
            ) : (
              "Normalize Props"
            )}
          </Button>
        </div>

        {duplicates && (
          <Alert
            variant={duplicates.success ? "default" : "destructive"}
            className="mt-4"
          >
            {duplicates.success ? (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Duplicate Props Found</AlertTitle>
                <AlertDescription>
                  Found {duplicates.count} duplicate group(s) with{" "}
                  {duplicates.totalDuplicateProps} total prop(s).
                  {duplicates.count === 0 && (
                    <span className="block mt-2">
                      No duplicates found. All props are unique.
                    </span>
                  )}
                </AlertDescription>
                {duplicates.duplicates && duplicates.duplicates.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {duplicates.duplicates.map((dup, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted rounded-md border border-border"
                      >
                        <div className="font-semibold text-sm mb-2">
                          Group {idx + 1} (normalized: &quot;{dup.normalized}
                          &quot;)
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              ✓ Canonical: &quot;{dup.suggestedCanonical.name}
                              &quot;
                            </span>{" "}
                            (ID: {dup.suggestedCanonical.id})
                          </div>
                          {dup.props
                            .filter((p) => p.id !== dup.suggestedCanonical.id)
                            .map((prop) => (
                              <div key={prop.id} className="text-muted-foreground">
                                → Will merge: &quot;{prop.name}&quot; (ID:{" "}
                                {prop.id})
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{duplicates.error}</AlertDescription>
              </>
            )}
          </Alert>
        )}

        {result && (
          <Alert
            variant={result.success ? "default" : "destructive"}
            className="mt-4"
          >
            {result.success ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  {result.message || "Props normalized successfully."}
                  {result.details && result.details.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="font-semibold text-sm mb-2">
                        Merged Details:
                      </div>
                      {result.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted rounded-md border border-border"
                        >
                          <div className="font-semibold text-sm mb-2">
                            {idx + 1}. Canonical: &quot;{detail.canonical}
                            &quot;
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Merged {detail.merged.length} prop(s):{" "}
                            {detail.merged.map((name, i) => (
                              <span key={i}>
                                &quot;{name}&quot;
                                {i < detail.merged.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {result.error || "Failed to normalize props"}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
