"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  useReplies,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/use-comments";
import { useVoteComment } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCommentSort } from "./comment-sort-context";
import { isContentAuthor } from "@/types/user";
import { Comment } from "@/types";
import { toast } from "sonner";
import { StaffContentActionMenu } from "@/components/features/moderation/staff-content-action-menu";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import {
  CommentComposerShell,
  CommentErrorState,
  CommentItemShell,
  CommentReplySkeleton,
  CommentThreadRail,
} from "./comment-primitives";

const MAX_VISUAL_DEPTH = 4;

export function ThreadedComment({
  comment,
  postId,
  depth = 0,
}: {
  comment: Comment;
  postId: string;
  depth?: number;
}) {
  const { user: currentUser } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const isAuthor = isContentAuthor(currentUser, comment.author_details, comment.author);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const hasReplies = Boolean(comment.reply_count && comment.reply_count > 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [localVoteCount, setLocalVoteCount] = useState(comment.vote_count ?? 0);
  const [localUserVote, setLocalUserVote] = useState(comment.user_vote ?? 0);

  useEffect(() => {
    setLocalVoteCount(comment.vote_count ?? 0);
    setLocalUserVote(comment.user_vote ?? 0);
  }, [comment.vote_count, comment.user_vote]);

  const author = comment.author_details;
  const preloadedReplies = comment.replies;
  const isPreloaded = Array.isArray(preloadedReplies);

  const { sort: commentSort } = useCommentSort();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError: isRepliesError,
    refetch: refetchReplies,
  } = useReplies(
    comment.id,
    hasReplies && !isPreloaded && Boolean(currentUser),
    commentSort
  );
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const voteMutation = useVoteComment();

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    const currentBody = replyBody;
    setReplyBody("");
    setShowReplyForm(false);
    setShowReplies(true);

    toast.promise(
      createComment.mutateAsync({ body: currentBody, parentId: comment.id, postId }),
      {
        loading: "Posting reply...",
        success: "Reply posted.",
        error: () => {
          setReplyBody(currentBody);
          setShowReplyForm(true);
          return "Failed to post reply.";
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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const userWeight =
    currentUser?.contributor_tier !== undefined ? currentUser.contributor_tier + 1 : 1;

  const handleVote = (value: 1 | -1 | 0) => {
    if (!currentUser) {
      requireAuth(undefined, { actionLabel: "vote on comments" });
      return;
    }
    if (isAuthor) {
      toast.info("You cannot vote on your own comment.");
      return;
    }
    if (localUserVote === value) return;
    const diff = (value - localUserVote) * userWeight;
    setLocalUserVote(value);
    setLocalVoteCount((prev) => prev + diff);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate({ commentId: comment.id, value });
    }, 1000);
  };

  const replies = isPreloaded
    ? preloadedReplies
    : (data?.pages.flatMap((p) => p.data) ?? []);

  return (
    <div className="cm-item-wrap">
      <CommentItemShell
        comment={comment}
        variant={depth > 0 ? "nested" : "top-level"}
        isAuthor={isAuthor}
        isEditing={isEditing}
        editBody={editBody}
        onEditBodyChange={setEditBody}
        onEditStart={() => {
          setEditBody(comment.body);
          setIsEditing(true);
        }}
        onEditCancel={() => {
          setIsEditing(false);
          setEditBody(comment.body);
        }}
        onEditSubmit={handleEditSubmit}
        isEditSubmitting={updateComment.isPending}
        showDeleteDialog={showDeleteDialog}
        onDeleteDialogChange={setShowDeleteDialog}
        onDeleteConfirm={handleDelete}
        isDeletePending={deleteComment.isPending}
        localVoteCount={localVoteCount}
        localUserVote={localUserVote}
        onUpvote={() => handleVote(localUserVote === 1 ? 0 : 1)}
        onDownvote={() => handleVote(localUserVote === -1 ? 0 : -1)}
        onReply={() => {
          if (!requireAuth(undefined, { actionLabel: "reply to this comment" })) return;
          setShowReplyForm((prev) => !prev);
        }}
        replyCount={comment.reply_count ?? 0}
        isRepliesExpanded={showReplies}
        onToggleReplies={() => {
          if (!requireAuth(undefined, { actionLabel: "view comment replies" })) return;
          setShowReplies((prev) => !prev);
        }}
        staffMenuSlot={
          <StaffContentActionMenu
            targetType="COMMENT"
            targetId={comment.id}
            targetTitle={`Comment by ${author?.display_name || "User"}`}
            author={author}
            isHidden={comment.is_hidden}
            isLocked={comment.is_locked}
            isDeleted={comment.is_deleted}
            variant="icon"
            className="h-6 w-6"
          />
        }
      />

      {showReplyForm && (
        <div className="cm-inline-reply-slot">
          <CommentComposerShell
            compact
            autoFocus
            label={`Reply to ${author?.display_name || "comment"}`}
            placeholder="Write a reply..."
            value={replyBody}
            onChange={setReplyBody}
            onSubmit={handleReplySubmit}
            submitLabel="Post reply"
            submittingLabel="Posting..."
            submitDisabled={!replyBody.trim()}
            isSubmitting={createComment.isPending}
            onCancel={() => setShowReplyForm(false)}
            cancelLabel="Cancel"
            replyTarget={{ authorName: author?.display_name || "User" }}
            onCancelReply={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {showReplies && (
        <CommentThreadRail clamped={depth >= MAX_VISUAL_DEPTH}>
          {isLoading && <CommentReplySkeleton />}

          {!isLoading && isRepliesError && (
            <CommentErrorState
              title="Could not load replies"
              description="Try reloading this reply branch."
              onRetry={() => refetchReplies()}
            />
          )}

          {replies.map((reply) => (
            <ThreadedComment
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
            />
          ))}

          {hasNextPage && (
            <div>
              <button
                type="button"
                className="cm-action-btn"
                data-accent="true"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                )}
                <span>{isFetchingNextPage ? "Loading..." : "Load more replies"}</span>
              </button>
            </div>
          )}
        </CommentThreadRail>
      )}
    </div>
  );
}
