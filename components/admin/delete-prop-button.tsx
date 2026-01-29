"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProp } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

export function DeletePropButton({
  propId,
  propName,
  eventsCount,
  userPropsCount,
}: {
  propId: number;
  propName: string;
  eventsCount: number;
  userPropsCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append("id", propId.toString());
      const result = await deleteProp(formData);

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        alert(result.error || "Failed to delete prop");
      }
    } catch (err) {
      console.error("Failed to delete prop:", err);
      alert("Failed to delete prop");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasUsage = eventsCount > 0 || userPropsCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Prop</AlertDialogTitle>
          <AlertDialogDescription>
            {hasUsage ? (
              <>
                Cannot delete "{propName}" because it is currently used by{" "}
                {eventsCount} event(s) and {userPropsCount} user prop(s).
                <br />
                <br />
                Please remove all references to this prop before deleting it.
              </>
            ) : (
              <>
                Are you sure you want to delete "{propName}"? This action
                cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {!hasUsage && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Prop"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
