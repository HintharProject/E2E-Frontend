"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useReplies,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/use-comments";
import { useReport, useVoteComment } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCommentSort } from "./comment-sort-context";
import { isContentAuthor } from "@/types/user";
import { Comment } from "@/types";
import { toast } from "sonner";
import { StaffContentActionMenu } from "@/components/features/moderation/staff-content-action-menu";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import {
  collectCommentParticipants,
  CommentComposerShell,
  CommentErrorState,
  CommentItemShell,
  CommentProfilePreviewUser,
  CommentReplySkeleton,
  CommentThreadRail,
} from "./comment-primitives";

const MAX_VISUAL_DEPTH = 4;

export function ThreadedComment({
  comment,
  postId,
  depth = 0,
  parentAuthorName = null,
  mentionUsers,
  isThreadLocked = false,
}: {
  comment: Comment;
  postId: string;
  depth?: number;
  parentAuthorName?: string | null;
  mentionUsers?: CommentProfilePreviewUser[];
  isThreadLocked?: boolean;
}) {
  const { user: currentUser } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const isAuthor = isContentAuthor(currentUser, comment.author_details, comment.author);
  const repliesRegionId = useId();

  const [showReplyForm, setShowReplyForm] = useState(false);
  const hasReplies = Boolean(comment.reply_count && comment.reply_count > 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const serverVoteCount = comment.vote_count ?? 0;
  const serverUserVote = comment.user_vote ?? 0;
  const [voteOverride, setVoteOverride] = useState<{
    baseCount: number;
    baseVote: number;
    count: number;
    vote: number;
  } | null>(null);

  const isOverrideCurrent =
    voteOverride !== null &&
    voteOverride.baseCount === serverVoteCount &&
    voteOverride.baseVote === serverUserVote;
  const localVoteCount = isOverrideCurrent ? voteOverride.count : serverVoteCount;
  const localUserVote = isOverrideCurrent ? voteOverride.vote : serverUserVote;

  const author = comment.author_details;
  const authorName = author?.display_name || "User";
  const preloadedReplies = comment.replies;
  const isPreloaded =
    Array.isArray(preloadedReplies) &&
    (preloadedReplies.length > 0 || (comment.reply_count ?? 0) === 0);

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
    showReplies && hasReplies && !isPreloaded && Boolean(currentUser),
    commentSort
  );
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const voteMutation = useVoteComment();
  const reportMutation = useReport();

  const isCommentUnavailable = Boolean(comment.is_deleted || comment.is_locked || isThreadLocked);
  const effectiveEditing = isEditing && !isCommentUnavailable;
  const effectiveReplying = showReplyForm && !effectiveEditing && !isCommentUnavailable;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || createComment.isPending) return;
    if (!requireAuth(undefined, { actionLabel: "reply to this comment" })) return;

    const promise = createComment.mutateAsync({
      body: replyBody,
      parentId: comment.id,
      postId,
    });
    toast.promise(promise, {
      loading: "Posting reply...",
      success: "Reply posted.",
      error: "Failed to post reply.",
    });

    try {
      await promise;
      setReplyBody("");
      setShowReplyForm(false);
      setShowReplies(true);
    } catch {
      // Keep replyBody and open form so user can retry without losing text
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBody.trim() || updateComment.isPending) return;

    const promise = updateComment.mutateAsync({
      commentId: comment.id,
      body: editBody,
    });
    toast.promise(promise, {
      loading: "Updating comment...",
      success: "Comment updated.",
      error: "Failed to update comment.",
    });

    try {
      await promise;
      setIsEditing(false);
    } catch {
      // Keep edit form open with user's draft intact
    }
  };

  const handleDelete = async () => {
    if (deleteComment.isPending) return;
    const promise = deleteComment.mutateAsync(comment.id);
    toast.promise(promise, {
      loading: "Deleting comment...",
      success: "Comment deleted.",
      error: "Failed to delete comment.",
    });

    try {
      await promise;
      setShowDeleteDialog(false);
    } catch {
      // Keep confirmation dialog open so user can retry or cancel
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link to clipboard.");
    }
  };

  const handleReport = async () => {
    if (!requireAuth(undefined, { actionLabel: "report comments" })) return;
    const promise = reportMutation.mutateAsync({
      targetId: comment.id,
      targetType: "COMMENT",
    });
    toast.promise(promise, {
      loading: "Submitting report...",
      success: "Comment reported to moderators.",
      error: "Failed to report. You may have already reported this comment.",
    });
    try {
      await promise;
    } catch {
      // Error surfaced via toast.promise
    }
  };

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
    if (comment.is_deleted || voteMutation.isPending || localUserVote === value) return;

    const diff = (value - localUserVote) * userWeight;
    setVoteOverride({
      baseCount: serverVoteCount,
      baseVote: serverUserVote,
      count: localVoteCount + diff,
      vote: value,
    });

    voteMutation.mutate(
      { commentId: comment.id, value },
      {
        onError: () => {
          setVoteOverride(null);
          toast.error("Failed to update vote.");
        },
      }
    );
  };

  const replies = isPreloaded
    ? preloadedReplies
    : (data?.pages.flatMap((p) => p.data) ?? []);
  const threadMentionUsers = collectCommentParticipants([comment, ...replies], mentionUsers);

  return (
    <div className="cm-item-wrap">
      <CommentItemShell
        comment={comment}
        variant={depth > 0 ? "nested" : "top-level"}
        depth={depth}
        replyingToName={parentAuthorName}
        repliesRegionId={repliesRegionId}
        isThreadLocked={isThreadLocked}
        isAuthor={isAuthor}
        renderMentions
        mentionUsers={threadMentionUsers}
        isEditing={effectiveEditing}
        editBody={editBody}
        onEditBodyChange={setEditBody}
        onEditStart={() => {
          setShowReplyForm(false);
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
        isVotePending={voteMutation.isPending}
        onReply={() => {
          if (isCommentUnavailable || effectiveEditing) return;
          if (!requireAuth(undefined, { actionLabel: "reply to this comment" })) return;
          setShowReplyForm((prev) => !prev);
        }}
        onShare={handleShare}
        onReport={!isAuthor ? handleReport : undefined}
        isReportPending={reportMutation.isPending}
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
            targetTitle={`Comment by ${authorName}`}
            author={author}
            isHidden={comment.is_hidden}
            isLocked={comment.is_locked}
            isDeleted={comment.is_deleted}
            variant="icon"
            className="cm-icon-btn min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7"
          />
        }
      />

      {effectiveReplying && (
        <div
          className="cm-inline-reply-slot"
          data-mobile-clamped={depth >= 2 ? "true" : "false"}
          data-clamped={depth >= MAX_VISUAL_DEPTH ? "true" : "false"}
        >
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
            replyTarget={{ authorName }}
            onCancelReply={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {showReplies && (
        <CommentThreadRail
          id={repliesRegionId}
          depth={depth}
          clamped={depth >= MAX_VISUAL_DEPTH}
          ariaLabel={`Replies to ${authorName}`}
        >
          {isLoading && <CommentReplySkeleton />}

          {!isLoading && isRepliesError && (
            <CommentErrorState
              title="Could not load replies"
              description="Try reloading this reply branch."
              onRetry={() => refetchReplies()}
            />
          )}

          {!isLoading && !isRepliesError && replies.length === 0 && (
            <p className="cm-empty-branch">No visible replies in this thread.</p>
          )}

          {replies.map((reply) => (
            <div key={reply.id} role="listitem" className="min-w-0">
              <ThreadedComment
                comment={reply}
                postId={postId}
                depth={depth + 1}
                parentAuthorName={comment.is_deleted ? null : authorName}
                mentionUsers={threadMentionUsers}
                isThreadLocked={isThreadLocked || Boolean(comment.is_locked)}
              />
            </div>
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
