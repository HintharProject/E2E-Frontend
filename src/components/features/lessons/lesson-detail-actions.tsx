"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDeleteLesson, useUpdateLessonState } from "@/hooks/use-interactions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Lesson } from "@/types";

export function LessonDetailActions({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const { user } = useCurrentUser();

  const deleteMutation = useDeleteLesson();
  const stateMutation = useUpdateLessonState();

  const isAuthor = user?.id === lesson.author_details?.id;
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "CREATOR";

  const canEdit = isCreator && isAuthor;
  const canDelete = isAdmin || (isCreator && isAuthor);
  const canChangeState = isAdmin || (isCreator && isAuthor);

  const canPublish = canChangeState && (lesson.state === "DRAFT" || lesson.state === "ARCHIVED");
  const canArchive = canChangeState && lesson.state === "PUBLISHED";

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<null | "PUBLISHED" | "ARCHIVED">(null);

  const handleDelete = () => {
    setDeleteOpen(false);
    toast.promise(deleteMutation.mutateAsync(lesson.id), {
      loading: "Deleting lesson...",
      success: () => {
        router.refresh();
        router.push("/lessons");
        return "Lesson deleted successfully";
      },
      error: "Failed to delete lesson. Please try again.",
    });
  };

  const handleStateChange = (targetState: "PUBLISHED" | "ARCHIVED") => {
    const label = targetState === "PUBLISHED" ? "Publish" : "Archive";
    setConfirmState(null);
    toast.promise(stateMutation.mutateAsync({ lessonId: lesson.id, state: targetState }), {
      loading: `${label}ing lesson...`,
      success: () => {
        router.refresh();
        return `Lesson ${label.toLowerCase()}d successfully`;
      },
      error: `Failed to ${label.toLowerCase()} lesson. Please try again.`,
    });
  };

  if (!canEdit && !canDelete && !canChangeState) {
    return null;
  }

  return (
    <>
      {canEdit ? (
        <Button variant="secondary" nativeButton={false} render={<Link href={`/lessons/${lesson.id}/edit`} />}>
          Edit
        </Button>
      ) : null}

      {canPublish ? (
        <Dialog open={confirmState === "PUBLISHED"} onOpenChange={(o) => setConfirmState(o ? "PUBLISHED" : null)}>
          <DialogTrigger render={<Button variant="default" />}>
            Publish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Lesson</DialogTitle>
              <DialogDescription>
                This lesson will become visible to all students. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmState(null)} disabled={stateMutation.isPending}>
                Cancel
              </Button>
              <Button variant="default" onClick={() => handleStateChange("PUBLISHED")} disabled={stateMutation.isPending}>
                {stateMutation.isPending ? "Publishing..." : "Publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {canArchive ? (
        <Dialog open={confirmState === "ARCHIVED"} onOpenChange={(o) => setConfirmState(o ? "ARCHIVED" : null)}>
          <DialogTrigger render={<Button variant="secondary" />}>
            Archive
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive Lesson</DialogTitle>
              <DialogDescription>
                This lesson will no longer be listed for students. You can publish it again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmState(null)} disabled={stateMutation.isPending}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => handleStateChange("ARCHIVED")} disabled={stateMutation.isPending}>
                {stateMutation.isPending ? "Archiving..." : "Archive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {canDelete ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger render={<Button variant="destructive" />}>
            Delete
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Lesson</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lesson? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteMutation.isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
