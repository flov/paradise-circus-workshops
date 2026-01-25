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
import { ShieldOff, Loader2 } from "lucide-react";
import { demoteUserFromAdmin } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

export function DemoteAdminButton({ userId }: { userId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);

  async function handleDemote() {
    setIsDemoting(true);

    try {
      const result = await demoteUserFromAdmin(userId);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        alert(result.error || "Failed to demote user from admin");
      }
    } catch (err) {
      console.error("Failed to demote user from admin:", err);
      alert("Failed to demote user from admin");
    } finally {
      setIsDemoting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldOff className="h-4 w-4 mr-2" />
          Demote Admin
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Demote User from Admin</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove admin privileges from this user?
            They will no longer have access to the admin panel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDemoting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDemote}
            disabled={isDemoting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDemoting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Demoting...
              </>
            ) : (
              "Demote from Admin"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
