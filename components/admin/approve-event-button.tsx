"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { approveEvent } from "@/app/admin/actions"
import { useRouter } from "next/navigation"

export function ApproveEventButton({ eventId }: { eventId: number }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleApprove() {
    setIsSubmitting(true)

    try {
      const result = await approveEvent(eventId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || "Failed to approve event")
      }
    } catch (err) {
      alert("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleApprove}
      disabled={isSubmitting}
    >
      <Check className="h-4 w-4 mr-1" />
      {isSubmitting ? "Approving..." : "Approve"}
    </Button>
  )
}
