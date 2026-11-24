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
  isLocked = false,
}: {
  problemId: string;
  isLocked?: boolean;
}) {
  const router = useRouter();
  const deleteMutation = useDeleteProblem();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  if (isLocked) {
    return null;
  }

  const handleDelete = () => {
    setOpen(false);
    setIsDeleting(true);
    router.push("/problems");

    toast.promise(deleteMutation.mutateAsync(problemId), {
      loading: "Deleting problem...",
      success: () => {
        router.refresh();
        return "Problem deleted successfully";
      },
      error: (err: unknown) => (err as { message?: string } | undefined)?.message || "Failed to delete problem. Please try again.",
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
            Are you sure you want to delete this problem? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
