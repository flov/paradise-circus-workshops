"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Trash2, Loader2 } from "lucide-react"
import { deleteEvent } from "@/app/admin/actions"
import { useRouter } from "next/navigation"

export function DeleteEventButton({ eventId, eventTitle }: { eventId: number; eventTitle: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cancellationMessage, setCancellationMessage] = useState("")

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteEvent(eventId, cancellationMessage.trim() || null)
      setOpen(false)
      setCancellationMessage("")
      router.refresh()
    } catch (err) {
      console.error("Failed to delete event:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset cancellation message when dialog closes
      setCancellationMessage("")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{eventTitle}"? This will also delete all associated participations and send cancellation emails to all participants. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="cancellation-message">
            Cancellation Message (Optional)
          </Label>
          <Textarea
            id="cancellation-message"
            placeholder="Add a message to inform participants about why this event was cancelled..."
            value={cancellationMessage}
            onChange={(e) => setCancellationMessage(e.target.value)}
            disabled={isDeleting}
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            This message will be included in the cancellation email sent to all participants.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Event"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
