"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBooking } from "@/app/actions"
import { Loader2 } from "lucide-react"

export function BookingForm({ workshopId }: { workshopId: number }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append("workshopId", workshopId.toString())

    try {
      const result = await createBooking(formData)

      if (result.success) {
        router.push(`/booking-confirmation/${result.bookingId}`)
      } else {
        setError(result.error || "Failed to create booking. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input id="name" name="name" type="text" placeholder="John Smith" required disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" name="email" type="email" placeholder="john@example.com" required disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567" disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Special Requirements or Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any dietary requirements, accessibility needs, or questions..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Confirm Booking"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting this form, you agree to our terms and conditions.
      </p>
    </form>
  )
}
