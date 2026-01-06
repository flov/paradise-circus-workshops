"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";

interface AddToCalendarButtonProps {
  bookingId: number;
  className?: string;
}

export function AddToCalendarButton({
  bookingId,
  className,
}: AddToCalendarButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/calendar/${bookingId}`);
      
      if (!response.ok) {
        throw new Error("Failed to download calendar file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `workshop-${bookingId}.ics`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading calendar file:", error);
      alert("Failed to download calendar file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant="outline"
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4" />
          Add to Calendar
        </>
      )}
    </Button>
  );
}

