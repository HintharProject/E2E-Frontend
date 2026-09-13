"use client";

import React, { useState, useRef } from "react";
import {
  useSolutionComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/use-comments";
import { useVoteComment, useReport } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Comment } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageSquare,
  Share2,
  Flag,
  Edit2,
  Trash2,
  Reply,
  ArrowUp,
  ArrowDown,
  X,
  CornerDownRight,
} from "lucide-react";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const inputClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm font-normal text-ink outline-none transition-all placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none";

// Format comment body to highlight @mentions
function renderFormattedBody(text: string) {
  const parts = text.split(/(@\w[\w\s]{0,24}?\b(?=\s|$)|\s+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      return (
        <span key={idx} className="font-semibold text-brand bg-brand/10 px-1 py-0.5 rounded text-xs">
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

// Single Flat Comment Item Card (with optional inline replies)
function FlatCommentItem({
  comment,
  solutionId,
  onReply,
}: {
  comment: Comment;
  solutionId: string;
  onReply: (parentId: string, authorName: string) => void;
}) {
  const { user: currentUser } = useCurrentUser();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const voteMutation = useVoteComment();
  const reportMutation = useReport();

  const isAuthor =
    (currentUser?.id && currentUser.id === comment.author_details?.id) ||
    (currentUser?.clerk_id && currentUser.clerk_id === comment.author_details?.clerk_id);
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN";

  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Local optimistic vote state
  const [localVoteCount, setLocalVoteCount] = useState(comment.vote_count ?? 0);
  const [localUserVote, setLocalUserVote] = useState<number | null>(comment.user_vote ?? null);

  const author = comment.author_details;
  const replies = comment.replies ?? [];

  const handleVote = (value: 1 | -1) => {
    if (!currentUser) {
      toast.error("You must be logged in to vote.");
      return;
    }
    const currentVal = localUserVote;
    const currentScore = localVoteCount;
    let newScore = currentScore;
    let newUserVote: number | null = value;

    if (currentVal === value) {
      newUserVote = null;
      newScore = currentScore - value;
    } else if (currentVal !== null) {
      newScore = currentScore - currentVal + value;
    } else {
      newScore = currentScore + value;
    }

    setLocalVoteCount(newScore);
    setLocalUserVote(newUserVote);

    voteMutation.mutate(
      { commentId: comment.id, value },
      {
        onError: () => {
          setLocalVoteCount(currentScore);
          setLocalUserVote(currentVal);
          toast.error("Failed to update vote.");
        },
      }
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBody.trim()) return;

    const currentBody = editBody;
    setIsEditing(false);

    toast.promise(
      updateComment.mutateAsync({ commentId: comment.id, body: currentBody }),
      {
        loading: "Updating comment...",
        success: "Comment updated.",
        error: () => {
          setEditBody(currentBody);
          setIsEditing(true);
          return "Failed to update comment.";
        },
      }
    );
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    toast.promise(deleteComment.mutateAsync(comment.id), {
      loading: "Deleting comment...",
      success: "Comment deleted.",
      error: "Failed to delete comment.",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleReport = () => {
    toast.promise(
      reportMutation.mutateAsync({ targetId: comment.id, targetType: "COMMENT" }),
      {
        loading: "Submitting report...",
        success: "Comment reported to moderators.",
        error: "Failed to report. You may have already reported this comment.",
      }
    );
  };

  return (
    <div className="group rounded-xl border border-line bg-card/60 p-4 transition-all hover:bg-card/90">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-7 w-7 ring-1 ring-line">
            <AvatarImage src={author?.profile_image_url || undefined} />
            <AvatarFallback className="text-[11px] font-bold bg-muted text-ink-muted">
              {getInitials(author?.display_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-ink truncate">
              {author?.display_name || "Unknown"}
            </span>

            {author?.contributor_tier !== undefined && (
              <ContributorBadge tier={author.contributor_tier} size="sm" />
            )}

            <span className="text-xs text-ink-muted">·</span>
            <span className="text-xs text-ink-muted">
              {formatDate(comment.created_at)}
            </span>
          </div>
        </div>

        {/* Edit / Delete menu for author/admin */}
        {(isAuthor || isAdmin) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-ink-muted hover:text-ink"
                onClick={() => setIsEditing((prev) => !prev)}
                title="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-ink-muted hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Body / Inline Edit Form */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="space-y-2 mt-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className={inputClass}
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditBody(comment.body);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!editBody.trim()}>
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap pl-9">
          {renderFormattedBody(comment.body)}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-3 mt-3 pl-9 text-xs text-ink-muted">
        {/* Vote Pill */}
        <div className="flex items-center rounded-full border border-line bg-muted/30 px-1 py-0.5">
          <button
            type="button"
            onClick={() => handleVote(1)}
            disabled={voteMutation.isPending}
            className={`p-1 rounded-full transition-colors ${
              localUserVote === 1
                ? "text-brand bg-brand/15 font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
            title="Upvote"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <span className="px-1 text-xs font-semibold text-ink min-w-[16px] text-center">
            {localVoteCount}
          </span>
          <button
            type="button"
            onClick={() => handleVote(-1)}
            disabled={voteMutation.isPending}
            className={`p-1 rounded-full transition-colors ${
              localUserVote === -1
                ? "text-amber-600 bg-amber-500/15 font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
            title="Downvote"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>

        {/* Reply Trigger */}
        <button
          type="button"
          onClick={() => onReply(comment.id, author?.display_name || "solver")}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          <Reply className="h-3.5 w-3.5" />
          <span>Reply</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>

        {/* Report Button */}
        {!isAuthor && (
          <button
            type="button"
            onClick={handleReport}
            disabled={reportMutation.isPending}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-destructive transition-colors cursor-pointer ml-auto"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Report</span>
          </button>
        )}
      </div>

      {/* Level 2 Replies directly under this comment */}
      {replies.length > 0 && (
        <div className="mt-3 ml-6 pl-3 border-l-2 border-line space-y-2 pt-1">
          {replies.map((reply) => {
            const replyAuthor = reply.author_details;
            const isReplyAuthor =
              (currentUser?.id && currentUser.id === replyAuthor?.id) ||
              (currentUser?.clerk_id && currentUser.clerk_id === replyAuthor?.clerk_id);

            return (
              <div
                key={reply.id}
                className="group/reply rounded-lg bg-muted/20 border border-line/40 p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-5 w-5 ring-1 ring-line">
                      <AvatarImage src={replyAuthor?.profile_image_url || undefined} />
                      <AvatarFallback className="text-[9px] font-bold bg-muted text-ink-muted">
                        {getInitials(replyAuthor?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-ink truncate">
                      {replyAuthor?.display_name || "Unknown"}
                    </span>
                    {replyAuthor?.contributor_tier !== undefined && (
                      <ContributorBadge tier={replyAuthor.contributor_tier} size="sm" />
                    )}
                    <span className="text-[10px] text-ink-muted">·</span>
                    <span className="text-[10px] text-ink-muted">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>

                  {/* Actions for reply author / admin */}
                  {(isReplyAuthor || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => {
                        toast.promise(deleteComment.mutateAsync(reply.id), {
                          loading: "Deleting reply...",
                          success: "Reply deleted.",
                          error: "Failed to delete reply.",
                        });
                      }}
                      className="text-ink-muted hover:text-destructive opacity-0 group-hover/reply:opacity-100 transition-opacity p-1"
                      title="Delete reply"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Reply Body */}
                <div className="text-xs text-ink leading-relaxed whitespace-pre-wrap pl-7">
                  {renderFormattedBody(reply.body)}
                </div>

                {/* Sub-reply trigger: tags the replier, but attaches to the same parent comment */}
                <div className="flex items-center gap-2 mt-2 pl-7 text-[11px] text-ink-muted">
                  <button
                    type="button"
                    onClick={() => onReply(comment.id, replyAuthor?.display_name || "solver")}
                    className="inline-flex items-center gap-1 hover:text-ink transition-colors cursor-pointer"
                  >
                    <CornerDownRight className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteComment.isPending}
            >
              {deleteComment.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// Main Solution Comments Component
// =============================================================================
export function SolutionComments({
  solutionId,
  totalCount,
  initialCount,
}: {
  solutionId: string;
  totalCount?: number;
  initialCount?: number;
}) {
  const { user: currentUser } = useCurrentUser();
  const createComment = useCreateComment();

  const [body, setBody] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    parentId: string;
    authorName: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch top-level comments with preloaded replies in a single request
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useSolutionComments(solutionId);

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  const count = totalCount ?? initialCount ?? comments.length;

  const handleReplyClick = (parentId: string, authorName: string) => {
    setReplyTarget({ parentId, authorName });
    const mention = `@${authorName} `;
    if (!body.includes(mention)) {
      setBody((prev) => (prev ? `${mention}${prev}` : mention));
    }
    textareaRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    if (!currentUser) {
      toast.error("Please log in to comment.");
      return;
    }

    const currentText = body;
    const parentId = replyTarget?.parentId;

    setBody("");
    setReplyTarget(null);

    toast.promise(
      createComment.mutateAsync({
        solutionId,
        parentId,
        body: currentText,
      }),
      {
        loading: parentId ? "Posting reply..." : "Posting comment...",
        success: parentId ? "Reply posted!" : "Comment posted!",
        error: () => {
          setBody(currentText);
          return "Failed to post comment.";
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand" />
          <h3 className="text-base font-semibold text-ink">
            Comments {count > 0 && <span className="text-ink-muted">({count})</span>}
          </h3>
        </div>
        <span className="text-xs text-ink-muted">
          Ask questions or leave feedback for the solver
        </span>
      </div>

      {/* Comment / Reply Input Box */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {replyTarget && (
          <div className="flex items-center justify-between text-xs bg-brand/10 border border-brand/20 text-brand px-3 py-1.5 rounded-lg">
            <span>
              Replying to <span className="font-semibold">@{replyTarget.authorName}</span>
            </span>
            <button
              type="button"
              onClick={handleCancelReply}
              className="text-brand hover:text-ink transition-colors"
              title="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              currentUser
                ? replyTarget
                  ? `Reply to @${replyTarget.authorName}...`
                  : "Ask a question or leave a thought on this solution..."
                : "Log in to join the discussion..."
            }
            disabled={!currentUser || createComment.isPending}
            rows={3}
            className={inputClass}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!currentUser || !body.trim() || createComment.isPending}
          >
            {createComment.isPending
              ? "Posting..."
              : replyTarget
              ? "Post Reply"
              : "Post Comment"}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-card border border-line animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-ink-muted/50 mb-2" />
            <p className="text-sm font-medium text-ink">No comments yet</p>
            <p className="text-xs text-ink-muted mt-1">
              Be the first to ask a question or leave feedback for this solution!
            </p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <FlatCommentItem
                key={comment.id}
                comment={comment}
                solutionId={solutionId}
                onReply={handleReplyClick}
              />
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading comments..." : "Load More Comments"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
