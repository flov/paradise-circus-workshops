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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { createEvent } from "@/app/admin/actions"
import { getAllProps } from "@/app/profile/actions"
import { useRouter } from "next/navigation"

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
  const [availableProps, setAvailableProps] = useState<Array<{ id: number; name: string }>>([])
  const [selectedPropId, setSelectedPropId] = useState<number | null>(null)

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value)
    } else {
      onOpenChange?.(value)
    }
  }

  // Fetch available props and reset selected props when dialog opens
  useEffect(() => {
    async function fetchProps() {
      try {
        const propsList = await getAllProps()
        setAvailableProps(propsList)
      } catch (error) {
        console.error("Failed to fetch props:", error)
      }
    }
    if (open) {
      setSelectedPropId(null) // Reset selected prop when dialog opens
      fetchProps()
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    if (selectedPropId !== null) {
      formData.append("propId", selectedPropId.toString())
    }

    try {
      const result = await createEvent(formData)

      if (result.success) {
        setSelectedPropId(null) // Reset selected prop on successful submission
        setOpen(false)
        // Reset form by clearing initialValues effect
        router.refresh()
      } else {
        setError(result.error || "Failed to create event")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
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
        <form
          key={JSON.stringify(initialValues)}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" name="title" required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor *</Label>
              <Input id="instructor" name="instructor" required disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" required disabled={isSubmitting} rows={3} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                disabled={isSubmitting}
                defaultValue={initialValues?.date}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                required
                disabled={isSubmitting}
                defaultValue={initialValues?.startTime}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                required
                disabled={isSubmitting}
                defaultValue={initialValues?.endTime}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <select
              id="location"
              name="location"
              required
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a location</option>
              <option value="Paradise Stage">Paradise Stage</option>
              <option value="Paradise River">Paradise River</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatToBring">What to Bring (Optional)</Label>
            <Textarea
              id="whatToBring"
              name="whatToBring"
              placeholder="Enter items participants should bring, one per line (e.g., Yoga mat&#10;Towel)"
              disabled={isSubmitting}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Each line will be displayed as a separate item. Leave blank if no items are needed.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id="isWorkshop"
                name="isWorkshop"
                defaultChecked={true}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isWorkshop" className="cursor-pointer">Is Workshop</Label>
            </label>
            <p className="text-xs text-muted-foreground">
              Check this box if this event is a workshop. Uncheck for other event types.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propId">Prop (Optional)</Label>
            <select
              id="propId"
              name="propId"
              value={selectedPropId || ""}
              onChange={(e) => {
                const value = e.target.value
                setSelectedPropId(value === "" ? null : parseInt(value, 10))
              }}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No prop selected</option>
              {availableProps.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Select a prop used in this event. Leave empty if no prop is needed.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
