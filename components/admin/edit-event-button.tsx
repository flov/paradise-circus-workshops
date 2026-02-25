"use client";

import type React from "react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import {
  updateEvent,
  deleteEvent,
  deleteEventAndFutureInstructorEvents,
} from "@/app/admin/actions";
import { useRouter } from "next/navigation";
import type { EventWithUserRelations } from "@/db/schema";
import { EventForm, type EventFormInitialValues } from "./event-form";

type EditEventButtonProps = {
  event: Pick<
    EventWithUserRelations,
    | "id"
    | "title"
    | "description"
    | "instructor"
    | "instructorId"
    | "date"
    | "startTime"
    | "endTime"
    | "location"
    | "whatToBring"
    | "isWorkshop"
    | "level"
    | "isPublished"
    | "propId"
    | "isRecurring"
    | "recurringUntil"
    | "lastUpdatedBy"
    | "approvedBy"
    | "createdAt"
    | "lastUpdatedByUser"
    | "approvedByUser"
  >;
};

export function EditEventButton({ event }: EditEventButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateEvent(formData);

      if (result.success) {
        setOpen(false);
        router.refresh();
        // Dispatch custom event to notify WeeklyTimetable to refresh
        window.dispatchEvent(new CustomEvent("event-updated"));
      } else {
        setError(result.error || "Failed to update event");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(
    eventId: number,
    cancellationMessage?: string | null,
  ) {
    try {
      await deleteEvent(eventId, cancellationMessage);
      setOpen(false);
      router.refresh();
      // Dispatch custom event to notify WeeklyTimetable to refresh
      window.dispatchEvent(new CustomEvent("event-deleted"));
    } catch (err) {
      setError("Failed to delete event");
      throw err;
    }
  }

  async function handleDeleteAllFuture(
    eventId: number,
    cancellationMessage?: string | null,
  ) {
    try {
      await deleteEventAndFutureInstructorEvents(eventId, cancellationMessage);
      setOpen(false);
      router.refresh();
      // Dispatch custom event to notify WeeklyTimetable to refresh
      window.dispatchEvent(new CustomEvent("event-deleted"));
    } catch (err) {
      setError("Failed to delete event and future events");
      throw err;
    }
  }

  // Format date for input
  const formattedDate = useMemo(() => {
    return new Date(event.date).toISOString().split("T")[0];
  }, [event.date]);
  
  // Format recurringUntil date for input (if it exists)
  // recurringUntil from database is already in YYYY-MM-DD format (date type)
  // Use it directly if it's a string, otherwise format it
  const formattedRecurringUntil = useMemo(() => {
    if (!event.recurringUntil) return undefined;
    
    if (typeof event.recurringUntil === "string") {
      // Check if it has time component (T) or space
      if (event.recurringUntil.includes("T") || event.recurringUntil.includes(" ")) {
        // Has time component, extract date part
        return new Date(event.recurringUntil).toISOString().split("T")[0];
      } else {
        // Already in YYYY-MM-DD format, use directly
        return event.recurringUntil;
      }
    } else {
      // Date object, format it
      return new Date(event.recurringUntil).toISOString().split("T")[0];
    }
  }, [event.recurringUntil]);

  // Convert event to EventFormInitialValues format
  const formInitialValues: EventFormInitialValues = useMemo(() => ({
    id: event.id,
    title: event.title,
    description: event.description || "",
    instructor: event.instructor || "",
    instructorId: event.instructorId,
    date: formattedDate,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    whatToBring: event.whatToBring,
    isWorkshop: event.isWorkshop ?? true,
    level: event.level ?? "All levels",
    isPublished: event.isPublished ?? true,
    propId: event.propId,
    isRecurring: event.isRecurring ?? false,
    recurringUntil: formattedRecurringUntil,
    createdAt: event.createdAt,
    lastUpdatedByUser: event.lastUpdatedByUser ?? null,
    approvedByUser: event.approvedByUser ?? null,
  }), [event, formattedDate, formattedRecurringUntil]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl md:max-w-4xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Update event details</DialogDescription>
        </DialogHeader>
        <EventForm
          key={`event-${event.id}-${event.recurringUntil || 'no-recurring'}`}
          initialValues={formInitialValues}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          error={error}
          submitButtonText="Update Event"
          submittingText="Updating..."
          onDelete={handleDelete}
          onDeleteAllFuture={handleDeleteAllFuture}
        />
      </DialogContent>
    </Dialog>
  );
}
