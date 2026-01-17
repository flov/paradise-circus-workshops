"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { generateGoogleCalendarURL, type EventCalendarData } from "@/lib/calendar";

interface EventCalendarButtonsProps {
  eventData: EventCalendarData;
  className?: string;
}

export function EventCalendarButtons({
  eventData,
  className,
}: EventCalendarButtonsProps) {
  const googleCalendarUrl = generateGoogleCalendarURL(eventData);

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className || ""}`}>
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
        <a href={`/api/event/${eventData.bookingId}/calendar`}>
          <Download className="h-4 w-4 mr-2" />
          Download ICS
        </a>
      </Button>
    </div>
  );
}
