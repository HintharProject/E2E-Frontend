"use client";

import { useState } from "react";
import { MoreHorizontal, Share2, Flag, Pencil, Trash2, Eye, Archive } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReport } from "@/hooks/use-interactions";

type ContentType = "POST" | "LESSON" | "PROBLEM" | "SOLUTION";

export interface CardMoreMenuProps {
  /** The URL to share */
  shareUrl: string;
  /** The target type for the report API */
  contentType: ContentType;
  /** The ID of the content for the report API */
  contentId: string;
  /** If provided, shows an Edit option linking to this href */
  editHref?: string;
  /** If provided, shows a Delete option that calls this function */
  onDelete?: () => Promise<void>;
  /** Delete confirmation text */
  deleteLabel?: string;
  /** If provided, shows a Publish option (Lessons only) */
  onPublish?: () => Promise<void>;
  /** If provided, shows an Archive option (Lessons only) */
  onArchive?: () => Promise<void>;
}

export function CardMoreMenu({
  shareUrl,
  contentType,
  contentId,
  editHref,
  onDelete,
  deleteLabel = "this item",
  onPublish,
  onArchive,
}: CardMoreMenuProps) {
  const reportMutation = useReport();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingState, setIsChangingState] = useState(false);

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  }

  function handleReport(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toast.promise(
      reportMutation.mutateAsync({ targetId: contentId, targetType: contentType }),
      {
        loading: "Submitting report...",
        success: "Report submitted. Thank you.",
        error: "Failed to submit report.",
      }
    );
  }

  async function handleDelete() {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handlePublish() {
    if (!onPublish) return;
    setIsChangingState(true);
    try {
      await onPublish();
      setPublishOpen(false);
    } finally {
      setIsChangingState(false);
    }
  }

  async function handleArchive() {
    if (!onArchive) return;
    setIsChangingState(true);
    try {
      await onArchive();
      setArchiveOpen(false);
    } finally {
      setIsChangingState(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted opacity-0 transition-opacity hover:bg-muted hover:text-ink group-hover:opacity-100 focus:opacity-100"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
          {/* Share */}
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </DropdownMenuItem>

          {/* Report */}
          <DropdownMenuItem
            onClick={handleReport}
            disabled={reportMutation.isPending}
          >
            <Flag className="h-3.5 w-3.5" />
            Report
          </DropdownMenuItem>

          {/* Edit — only if authorized */}
          {editHref && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                <Link href={editHref} className="flex items-center gap-2 w-full">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* Publish — Lessons only, if applicable */}
          {onPublish && (
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPublishOpen(true); }}>
              <Eye className="h-3.5 w-3.5" />
              Publish
            </DropdownMenuItem>
          )}

          {/* Archive — Lessons only, if applicable */}
          {onArchive && (
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setArchiveOpen(true); }}>
              <Archive className="h-3.5 w-3.5" />
              Archive
            </DropdownMenuItem>
          )}

          {/* Delete — only if authorized */}
          {onDelete && (
            <>
              {!editHref && !onPublish && !onArchive && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteOpen(true); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      {onDelete && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {deleteLabel}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deleteLabel}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Publish Confirmation Dialog */}
      {onPublish && (
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Lesson</DialogTitle>
              <DialogDescription>
                This lesson will become visible to all students. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={isChangingState}>
                Cancel
              </Button>
              <Button variant="default" onClick={handlePublish} disabled={isChangingState}>
                {isChangingState ? "Publishing..." : "Publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive Confirmation Dialog */}
      {onArchive && (
        <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive Lesson</DialogTitle>
              <DialogDescription>
                This lesson will no longer be listed for students. You can publish it again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={isChangingState}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleArchive} disabled={isChangingState}>
                {isChangingState ? "Archiving..." : "Archive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
