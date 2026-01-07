"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBooking } from "@/app/actions";
import { Loader2 } from "lucide-react";
import { getUserName, getUserEmail } from "@/lib/utils";

export function BookingForm({ 
  workshopId, 
  isPast 
}: { 
  workshopId: number;
  isPast: boolean;
}) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Auto-fill name and email from Clerk user when available
  useEffect(() => {
    if (isLoaded && user) {
      const userName = getUserName(user);
      const userEmail = getUserEmail(user);
      if (userName) setName(userName);
      if (userEmail) setEmail(userEmail);
    }
  }, [isLoaded, user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("workshopId", workshopId.toString());
    
    // Add name and email from state if user is logged in (they're hidden but still needed)
    if (user) {
      formData.set("name", name);
      formData.set("email", email);
    }

    try {
      const result = await createBooking(formData);

      if (result.success) {
        router.push(`/booking-confirmation/${result.bookingId}`);
      } else {
        setError(result.error || "Failed to create booking. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show sign-in prompt for future workshops when not logged in
  if (!isPast && isLoaded && !user) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-muted/50 border border-border p-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please sign in to book this workshop
          </p>
          <SignInButton mode="modal">
            <Button className="w-full">Sign In to Book</Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const isLoggedIn = isLoaded && user;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Only show name/email fields when not logged in */}
      {!isLoggedIn && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </>
      )}

      {/* Show user info when logged in */}
      {isLoggedIn && (
        <div className="space-y-2">
          <div className="rounded-md bg-muted/50 border border-border p-3">
            <div className="text-sm">
              <div className="font-medium text-foreground mb-1">Booking as:</div>
              <div className="text-muted-foreground">{name || "User"}</div>
              <div className="text-muted-foreground">{email}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Special Requirements or Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Questions, missing props, or special requests..."
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
          "Book Now"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting this form, you agree to our terms and conditions.
      </p>
    </form>
  );
}
