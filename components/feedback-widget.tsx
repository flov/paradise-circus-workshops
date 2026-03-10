"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { submitFeedback } from "@/app/actions"

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleOpen() {
    setOpen(true)
    setSuccess(false)
    setError(null)
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      setOpen(false)
      setMessage("")
      setName("")
      setEmail("")
      setSuccess(false)
      setError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set("message", message)
    if (name) formData.set("name", name)
    if (email) formData.set("email", email)

    const result = await submitFeedback(formData)
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      closeTimerRef.current = setTimeout(() => {
        setOpen(false)
        setMessage("")
        setName("")
        setEmail("")
        setSuccess(false)
      }, 1500)
    } else {
      setError(result.error ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground text-xs font-semibold tracking-widest px-2 py-2 rounded-l-md cursor-pointer hover:bg-primary/90 transition-colors"
        style={{ writingMode: "vertical-rl" }}
        aria-label="Open feedback form"
      >
        FEEDBACK
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Share your thoughts, suggestions, or report a bug. If you have an
              idea, or don't like something, please let us know! We read every
              message. You can send it anonymously or include your name/email if
              you'd like a response.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center text-sm font-medium text-green-600">
              Thank you for your feedback!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot: hidden from real users, bots fill it in */}
              <input
                type="text"
                name="website"
                value=""
                onChange={() => {}}
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: "none" }}
              />
              <Input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <Input
                type="email"
                placeholder="Your email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Textarea
                placeholder="Your feedback..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || message.trim().length === 0}
                >
                  {loading ? "Sending..." : "Send Feedback"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
