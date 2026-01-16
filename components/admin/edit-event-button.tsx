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
import { Pencil, Loader2 } from "lucide-react"
import { updateEvent, getEventProps } from "@/app/admin/actions"
import { getAllProps } from "@/app/profile/actions"
import { useRouter } from "next/navigation"
import type { Event } from "@/db/schema"

export function EditEventButton({ event }: { event: Pick<Event, "id" | "title" | "description" | "instructor" | "date" | "startTime" | "endTime" | "location" | "whatToBring" | "isWorkshop"> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableProps, setAvailableProps] = useState<Array<{ id: number; name: string }>>([])
  const [selectedProps, setSelectedProps] = useState<number[]>([])

  // Format date for input
  const formattedDate = new Date(event.date).toISOString().split("T")[0]

  // Fetch available props and current event props
  useEffect(() => {
    async function fetchData() {
      try {
        const [propsList, eventPropsList] = await Promise.all([
          getAllProps(),
          getEventProps(event.id),
        ])
        setAvailableProps(propsList)
        setSelectedProps(eventPropsList.map(ep => ep.propId))
      } catch (error) {
        console.error("Failed to fetch props:", error)
      }
    }
    if (open) {
      fetchData()
    }
  }, [open, event.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append("id", event.id.toString())
    formData.append("props", JSON.stringify(selectedProps))

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" name="title" defaultValue={event.title} required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor *</Label>
              <Input
                id="instructor"
                name="instructor"
                defaultValue={event.instructor}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={event.description}
              required
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" defaultValue={formattedDate} required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                defaultValue={event.startTime}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                defaultValue={event.endTime}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <select
              id="location"
              name="location"
              defaultValue={event.location}
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
              defaultValue={event.whatToBring || ""}
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
                defaultChecked={event.isWorkshop ?? true}
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
            <Label>Props (Optional)</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {availableProps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No props available. Create props in user profiles first.</p>
              ) : (
                availableProps.map((prop) => (
                  <label key={prop.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProps.includes(prop.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProps([...selectedProps, prop.id])
                        } else {
                          setSelectedProps(selectedProps.filter(id => id !== prop.id))
                        }
                      }}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{prop.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Select props used in this event. You can select multiple props.
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
                  Updating...
                </>
              ) : (
                "Update Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
