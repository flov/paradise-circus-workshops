"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface AddToCalendarButtonProps {
  confirmationToken: string;
  className?: string;
}

export function AddToCalendarButton({
  confirmationToken,
  className,
}: AddToCalendarButtonProps) {
  return (
    <Button
      asChild
      variant="outline"
      className={className}
    >
      <a href={`/api/calendar/${confirmationToken}`}>
        <Calendar className="h-4 w-4" />
        Add to Calendar
      </a>
    </Button>
  );
}

