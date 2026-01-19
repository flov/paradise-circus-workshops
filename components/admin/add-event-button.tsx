"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { createEvent } from "@/app/admin/actions"
import { useRouter } from "next/navigation"
import { EventForm, type EventFormInitialValues } from "./event-form"

type AddEventButtonProps = {
  initialValues?: {
    date?: string
    startTime?: string
    endTime?: string
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function AddEventButton({
  initialValues,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: AddEventButtonProps = {}) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value)
    } else {
      onOpenChange?.(value)
    }
  }

  // Reset error when dialog opens
  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createEvent(formData)

      if (result.success) {
        setOpen(false)
        router.refresh()
        // Dispatch custom event to notify WeeklyTimetable to refresh
        window.dispatchEvent(new CustomEvent('event-created'))
      } else {
        setError(result.error || "Failed to create event")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formInitialValues: EventFormInitialValues = {
    date: initialValues?.date,
    startTime: initialValues?.startTime,
    endTime: initialValues?.endTime,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>Create a new event for participants to book</DialogDescription>
        </DialogHeader>
        <EventForm
          key={JSON.stringify(initialValues)}
          initialValues={formInitialValues}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          error={error}
          submitButtonText="Create Event"
          submittingText="Creating..."
        />
      </DialogContent>
    </Dialog>
  )
}
