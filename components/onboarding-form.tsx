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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setError(validation.error || "Invalid username");
      setIsSubmitting(false);
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
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to create account");
        setIsSubmitting(false);
        return;
      }

      // Redirect to profile creation
      router.push("/profile/create");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
}
