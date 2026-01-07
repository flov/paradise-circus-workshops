"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface AddToCalendarButtonProps {
  bookingId: number;
  className?: string;
}

export function AddToCalendarButton({
  bookingId,
  className,
}: AddToCalendarButtonProps) {
  return (
    <Button
      asChild
      variant="outline"
      className={className}
    >
      <a href={`/api/calendar/${bookingId}`}>
        <Calendar className="h-4 w-4" />
        Add to Calendar
      </a>
    </Button>
  );
}

