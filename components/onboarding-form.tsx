"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserRecord } from "@/app/profile/actions";
import { validateUsername } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface OnboardingFormProps {
  initialUsername: string;
}

export function OnboardingForm({ initialUsername }: OnboardingFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isArtist, setIsArtist] = useState<boolean | null>(null);

  async function handleSubmit(isArtistChoice: boolean) {
    setIsSubmitting(true);
    setError(null);
    setIsArtist(isArtistChoice);

    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setError(validation.error || "Invalid username");
      setIsSubmitting(false);
      setIsArtist(null);
      return;
    }

    try {
      // Get clerkUserId from server action context
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          isArtist: isArtistChoice,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to create account");
        setIsSubmitting(false);
        setIsArtist(null);
        return;
      }

      // Redirect based on choice
      if (isArtistChoice) {
        router.push("/profile/create");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
      setIsArtist(null);
    }
  }

  if (isArtist === null) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Choose your username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            disabled={isSubmitting}
            className={error ? "border-destructive" : ""}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            3-30 characters, letters, numbers, hyphens, and underscores only
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">
            Are you a circus or flow artist?
          </h2>

          <div className="flex gap-4">
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes"
              )}
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "No"
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Clicking &quot;Yes&quot; sets up your artist profile to showcase your skills and connect with the community.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
