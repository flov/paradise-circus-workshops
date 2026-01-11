"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { generateGoogleCalendarURL, type WorkshopCalendarData } from "@/lib/calendar";

interface WorkshopCalendarButtonsProps {
  workshopData: WorkshopCalendarData;
  eventSlug: string;
  className?: string;
}

export function WorkshopCalendarButtons({
  workshopData,
  eventSlug,
  className,
}: WorkshopCalendarButtonsProps) {
  const googleCalendarUrl = generateGoogleCalendarURL(workshopData);

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Button
        asChild
        variant="outline"
        className="flex-1"
      >
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Add to Google Calendar
        </a>
      </Button>
      <Button
        asChild
        variant="outline"
        className="flex-1"
      >
        <a href={`/api/workshop/${workshopData.bookingId}/calendar`}>
          <Download className="h-4 w-4 mr-2" />
          Download ICS
        </a>
      </Button>
    </div>
  );
}
