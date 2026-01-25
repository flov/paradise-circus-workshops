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
import { Shield, Loader2 } from "lucide-react";
import { promoteUserToAdmin } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

export function PromoteAdminButton({ userId }: { userId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  async function handlePromote() {
    setIsPromoting(true);

    try {
      const result = await promoteUserToAdmin(userId);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        alert(result.error || "Failed to promote user to admin");
      }
    } catch (err) {
      console.error("Failed to promote user to admin:", err);
      alert("Failed to promote user to admin");
    } finally {
      setIsPromoting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Promote Admin
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Promote User to Admin</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to promote this user to admin? They will have
            full access to the admin panel and can manage events, users, and
            other admin functions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPromoting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePromote}
            disabled={isPromoting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPromoting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting...
              </>
            ) : (
              "Promote to Admin"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
