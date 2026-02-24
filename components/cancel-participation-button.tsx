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
import { Loader2 } from "lucide-react"
import { cancelParticipation } from "@/app/actions"
import { useRouter } from "next/navigation"

export function CancelParticipationButton({
  participationId,
  variant = "default",
  className
}: {
  participationId: number
  variant?: "default" | "destructive" | "outline" | "ghost"
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setIsCancelling(true)
    setError(null)

    try {
      const result = await cancelParticipation(participationId)
      
      if (result.success) {
        setOpen(false)
        router.push("/")
        router.refresh()
      } else {
        setError(result.error || "Failed to cancel participation")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Failed to cancel participation:", err)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className={className}>
          Cancel Participation
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Participation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this participation? This action cannot be undone and your spot will be released.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Keep Participation</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isCancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Participation"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

