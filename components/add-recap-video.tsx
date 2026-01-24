"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateEventRecapVideo } from "@/app/admin/actions";
import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";

type AddRecapVideoProps = {
  eventId: number;
  currentRecapVideoId?: string | null;
};

export function AddRecapVideo({ eventId, currentRecapVideoId }: AddRecapVideoProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [videoId, setVideoId] = useState(currentRecapVideoId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateEventRecapVideo(eventId, videoId.trim() || null);

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to update recap video");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {currentRecapVideoId ? "Update Recap Video" : "Add Recap Video"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Workshop Recap Video</DialogTitle>
          <DialogDescription>
            Share a recap video of this workshop with the community.
          </DialogDescription>
        </DialogHeader>
        {!isLoaded ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : !user ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please sign in to add a recap video.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full">Sign In</Button>
            </SignInButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoId">YouTube Video ID</Label>
              <Input
                id="videoId"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="e.g., dQw4w9WgXcQ"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Enter the YouTube video ID. You can find this in the YouTube URL after "v=" (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ).
              </p>
            </div>
            <div className="rounded-md bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Important Instructions:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Upload your recap video to YouTube first</li>
                <li>You can upload it as "Unlisted" so it's only visible here</li>
                <li>Copy the video ID from the YouTube URL</li>
                <li>Paste it in the field above</li>
              </ul>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setVideoId(currentRecapVideoId || "");
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
