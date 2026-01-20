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
  eventId, 
  isPast,
  initialUserName = "",
  initialUserEmail = "",
  isAuthenticated = false
}: { 
  eventId: number;
  isPast: boolean;
  initialUserName?: string;
  initialUserEmail?: string;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialUserName);
  const [email, setEmail] = useState(initialUserEmail);

  // Update name and email from Clerk user when client-side data loads (for real-time updates)
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
    formData.append("eventId", eventId.toString());
    
    // Add name and email from state if user is logged in (they're hidden but still needed)
    if (isLoggedIn) {
      formData.set("name", name);
      formData.set("email", email);
    }

    try {
      const result = await createBooking(formData);

      if (result.success && result.confirmationToken) {
        router.push(`/booking-confirmation/${result.confirmationToken}`);
      } else {
        setError(result.error || "Failed to create participation. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Use server-provided auth state if available, otherwise wait for client-side loading
  // This allows immediate rendering when navigating from server-rendered pages
  const isLoggedIn = isAuthenticated || (isLoaded && !!user);
  const showLoading = !isLoaded && !isAuthenticated;

  // Show loading state only if we don't have server-side auth data
  if (showLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-muted/50 border border-border p-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt for future workshops when not logged in
  if (!isPast && !isLoggedIn) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-muted/50 border border-border p-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please sign in to participate in this event
          </p>
          <SignInButton mode="modal">
            <Button className="w-full">Sign In to Participate</Button>
          </SignInButton>
        </div>
      </div>
    );
  }

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
              <div className="font-medium text-foreground mb-1">Participating as:</div>
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
          "Participate"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting this form, you agree to our terms and conditions.
      </p>
    </form>
  );
}
