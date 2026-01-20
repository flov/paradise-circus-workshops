"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateEvent, deleteEvent } from "@/app/admin/actions"
import { EventForm, type EventFormInitialValues } from "@/components/admin/event-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type EditEventPageClientProps = {
  initialValues: EventFormInitialValues
  eventTitle: string
  eventSlug: string
}

export function EditEventPageClient({
  initialValues,
  eventTitle,
  eventSlug,
}: EditEventPageClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateEvent(formData)

      if (result.success) {
        // Redirect to the event page after successful update
        router.push(`/event/${eventSlug}`)
        router.refresh()
        // Dispatch custom event to notify WeeklyTimetable to refresh
        window.dispatchEvent(new CustomEvent('event-updated'))
      } else {
        setError(result.error || "Failed to update event")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(eventId: number, cancellationMessage?: string | null) {
    try {
      await deleteEvent(eventId, cancellationMessage)
      // Redirect to home after successful deletion
      router.push("/")
      router.refresh()
      // Dispatch custom event to notify WeeklyTimetable to refresh
      window.dispatchEvent(new CustomEvent('event-deleted'))
    } catch (err) {
      setError("Failed to delete event")
      throw err
    }
  }

  function handleCancel() {
    router.back()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
        <CardDescription>
          Update the details for "{eventTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EventForm
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          error={error}
          submitButtonText="Update Event"
          submittingText="Updating..."
          onDelete={handleDelete}
          eventTitle={eventTitle}
        />
      </CardContent>
    </Card>
  )
}
