"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDeleteProblem } from "@/hooks/use-problems";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProblemAuthorActions({
  problemId,
  isFinal = false,
}: {
  problemId: string;
  isFinal?: boolean;
}) {
  const router = useRouter();
  const deleteMutation = useDeleteProblem();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    if (isFinal) {
      toast.error("Finalized problems cannot be deleted by users. Contact staff moderation.");
      setOpen(false);
      return;
    }

    setOpen(false);
    router.push("/problems");

    toast.promise(deleteMutation.mutateAsync(problemId), {
      loading: "Deleting problem...",
      success: () => {
        router.refresh();
        return "Problem deleted successfully";
      },
      error: (err: any) => err?.message || "Failed to delete problem. Please try again.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        Delete Problem
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Problem</DialogTitle>
          <DialogDescription>
            {isFinal ? (
              "This problem has reached Verified Consensus Finality. Finalized problems cannot be deleted by authors."
            ) : (
              "Are you sure you want to delete this problem? Any milestone bonuses will be reconciled and this action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          {!isFinal && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
