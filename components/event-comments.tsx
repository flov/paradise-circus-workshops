"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/utils";
import { addComment, deleteComment } from "@/app/actions";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Comment } from "@/db/schema";

type EventCommentsProps = {
  eventId: number;
  comments: Comment[];
  currentUserId: string | null;
  currentUserName?: string;
  currentUserImageUrl?: string | null;
};

function formatRelativeTime(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string | null;
  onDelete: (id: number) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isOwn = currentUserId === comment.clerkUserId;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result.success) {
        onDelete(comment.id);
      }
    });
  };

  return (
    <div
      className={cn(
        "group flex gap-3 py-3 transition-colors",
        "border-b border-border/50 last:border-b-0",
      )}
    >
      <Avatar className="size-8 shrink-0 ring-2 ring-primary/10">
        {comment.authorImageUrl && (
          <AvatarImage src={comment.authorImageUrl} alt={comment.authorName} />
        )}
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {getInitials(comment.authorName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {comment.authorName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {isOwn && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              )}
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Delete comment</span>
            </Button>
          )}
        </div>

        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

export function EventComments({
  eventId,
  comments: initialComments,
  currentUserId,
  currentUserName = "",
  currentUserImageUrl,
}: EventCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    const content = newComment.trim();
    setNewComment("");

    startTransition(async () => {
      const result = await addComment(eventId, content);
      if (result.success && result.commentId) {
        // Optimistically add the comment to the list
        setComments((prev) => [
          ...prev,
          {
            id: result.commentId,
            authorName: currentUserName,
            authorImageUrl: currentUserImageUrl || null,
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
            eventId,
            clerkUserId: currentUserId,
          },
        ]);
      }
    });
  };

  const handleDelete = (commentId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="pt-6 mt-6 border-t border-border">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          Conversation
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-3">
            <Avatar className="size-8 shrink-0 ring-2 ring-primary/10">
              {currentUserImageUrl && (
                <AvatarImage src={currentUserImageUrl} alt={currentUserName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getInitials(currentUserName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Share your thoughts, ask questions, or connect with others..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className={cn(
                  "min-h-[80px] resize-none",
                  "focus-visible:ring-primary/50",
                )}
                disabled={isPending}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || isPending}
                  className="gap-2"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 px-6 bg-muted/50 rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">
            <a
              href="/sign-in"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </a>{" "}
            to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to start the conversation!
          </p>
        </div>
      )}
    </div>
  );
}
