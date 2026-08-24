"use client";

import Link from "next/link";
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

export function ProblemAuthorActions({ problemId }: { problemId: string }) {
  const router = useRouter();
  const deleteMutation = useDeleteProblem();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    setOpen(false);
    router.push("/problems");

    toast.promise(deleteMutation.mutateAsync(problemId), {
      loading: "Deleting problem...",
      success: () => {
        router.refresh();
        return "Problem deleted successfully";
      },
      error: "Failed to delete problem. Please try again.",
    });
  };

  return (
    <>
      <Button variant="secondary" nativeButton={false} render={<Link href={`/problems/${problemId}/edit`} />}>
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="destructive" />}>
          Delete
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
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
