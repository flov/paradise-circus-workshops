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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2 } from "lucide-react"
import { updateWorkshop } from "@/app/admin/actions"
import { useRouter } from "next/navigation"

type Workshop = {
  id: number
  title: string
  description: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  location: string
}

export function EditWorkshopButton({ workshop }: { workshop: Workshop }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format date for input
  const formattedDate = new Date(workshop.date).toISOString().split("T")[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append("id", workshop.id.toString())

    try {
      const result = await updateWorkshop(formData)

      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to update workshop")
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
          <DialogTitle>Edit Workshop</DialogTitle>
          <DialogDescription>Update workshop details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Workshop Title *</Label>
              <Input id="title" name="title" defaultValue={workshop.title} required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor *</Label>
              <Input
                id="instructor"
                name="instructor"
                defaultValue={workshop.instructor}
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
              defaultValue={workshop.description}
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
                defaultValue={workshop.start_time}
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
                defaultValue={workshop.end_time}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" name="location" defaultValue={workshop.location} required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Max Capacity *</Label>
              <Input
                id="max_capacity"
                name="max_capacity"
                type="number"
                min="1"
                defaultValue={workshop.max_capacity}
                required
                disabled={isSubmitting}
              />
            </div>
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
                "Update Workshop"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
