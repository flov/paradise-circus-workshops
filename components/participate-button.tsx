"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { createParticipation } from "@/app/actions";
import { Loader2 } from "lucide-react";
import { getUserName, getUserEmail } from "@/lib/utils";

interface ParticipateButtonProps {
  eventId: number;
  isPast: boolean;
  isAuthenticated: boolean;
  userName: string;
  userEmail: string;
}

export function ParticipateButton({
  eventId,
  isPast,
  isAuthenticated: serverIsAuthenticated,
  userName: serverUserName,
  userEmail: serverUserEmail,
}: ParticipateButtonProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use server-provided auth state if available, otherwise wait for client-side loading
  const isAuthenticated = serverIsAuthenticated || (isLoaded && !!user);
  const userName = serverUserName || (user ? getUserName(user) : "");
  const userEmail = serverUserEmail || (user ? getUserEmail(user) : "");

  async function handleParticipateNow() {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("eventId", eventId.toString());
    formData.append("name", userName);
    formData.append("email", userEmail);

    try {
      const result = await createParticipation(formData);

      if (result.success && result.confirmationToken) {
        router.push(`/participation-confirmation/${result.confirmationToken}`);
      } else {
        setError(result.error || "Failed to create participation. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPast) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        This event has already ended and participations are no longer available.
      </p>
    );
  }

  // Show loading state only if we don't have server-side auth data
  if (!isLoaded && !serverIsAuthenticated) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <SignInButton mode="modal">
          <Button className="w-full" size="lg">
            Sign In to Participate
          </Button>
        </SignInButton>
        {error && (
          <div className="mt-2 rounded-md bg-destructive/10 border border-destructive/20 p-2 text-sm text-destructive text-center">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleParticipateNow}
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Participate"
        )}
      </Button>
      {error && (
        <div className="mt-2 rounded-md bg-destructive/10 border border-destructive/20 p-2 text-sm text-destructive text-center">
          {error}
        </div>
      )}
    </>
  );
}

