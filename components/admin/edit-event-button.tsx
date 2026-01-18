"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import { updateEvent } from "@/app/admin/actions"
import { useRouter } from "next/navigation"
import type { Event } from "@/db/schema"
import { EventForm, type EventFormInitialValues } from "./event-form"

export function EditEventButton({ event }: { event: Pick<Event, "id" | "title" | "description" | "instructor" | "instructorId" | "date" | "startTime" | "endTime" | "location" | "whatToBring" | "isWorkshop" | "propId"> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateEvent(formData)

      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to update event")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for input
  const formattedDate = new Date(event.date).toISOString().split("T")[0]

  // Convert event to EventFormInitialValues format
  const formInitialValues: EventFormInitialValues = {
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
    propId: event.propId,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Update event details</DialogDescription>
        </DialogHeader>
        <EventForm
          initialValues={formInitialValues}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          error={error}
          submitButtonText="Update Event"
          submittingText="Updating..."
        />
      </DialogContent>
    </Dialog>
  )
}
