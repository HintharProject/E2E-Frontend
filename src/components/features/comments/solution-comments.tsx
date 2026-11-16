"use client";

import React, { useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  useSolutionComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/use-comments";
import { useVoteComment, useReport } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import { isContentAuthor } from "@/types/user";
import { Comment } from "@/types";
import { toast } from "sonner";
import { StaffContentActionMenu } from "@/components/features/moderation/staff-content-action-menu";
import { CommentSortProvider, useCommentSort } from "./comment-sort-context";
import { CommentSortToggle } from "./comment-sort-toggle";
import {
  collectCommentParticipants,
  CommentComposerShell,
  CommentEmptyState,
  CommentErrorState,
  CommentGuestGate,
  CommentItemShell,
  CommentLockedBanner,
  CommentModuleRoot,
  CommentProfilePreviewUser,
  CommentSectionHeader,
  CommentSkeletonList,
  CommentThreadRail,
} from "./comment-primitives";

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Single Level-2 Reply Item (delegates deletion confirmation safely while preserving exact handler)
function SolutionReplyItem({
  reply,
  parentCommentId,
  replyingToName,
  mentionUsers,
  isThreadLocked = false,
  onReply,
}: {
  reply: Comment;
  parentCommentId: string;
  replyingToName?: string | null;
  mentionUsers?: CommentProfilePreviewUser[];
  isThreadLocked?: boolean;
  onReply: (parentId: string, authorName: string) => void;
}) {
  const { user: currentUser } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const deleteComment = useDeleteComment();
  const reportMutation = useReport();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const replyAuthor = reply.author_details;
  const replyAuthorName = replyAuthor?.display_name || "solver";
  const isReplyAuthor = isContentAuthor(currentUser, replyAuthor, reply.author);

  const handleDeleteReply = async () => {
    if (deleteComment.isPending) return;
    const promise = deleteComment.mutateAsync(reply.id);
    toast.promise(promise, {
      loading: "Deleting reply...",
      success: "Reply deleted.",
      error: "Failed to delete reply.",
    });

    try {
      await promise;
      setShowDeleteDialog(false);
    } catch {
      // Keep confirmation dialog open on failure
    }
  };

  const handleShareReply = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}#comment-${reply.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link to clipboard.");
    }
  };

  const handleReportReply = async () => {
    if (!requireAuth(undefined, { actionLabel: "report comments" })) return;
    const promise = reportMutation.mutateAsync({
      targetId: reply.id,
      targetType: "COMMENT",
    });
    toast.promise(promise, {
      loading: "Submitting report...",
      success: "Reply reported to moderators.",
      error: "Failed to report. You may have already reported this reply.",
    });
    try {
      await promise;
    } catch {
      // Surfaced via toast.promise
    }
  };

  return (
    <CommentItemShell
      comment={reply}
      variant="nested"
      depth={1}
      replyingToName={replyingToName}
      isThreadLocked={isThreadLocked}
      isAuthor={isReplyAuthor}
      canEdit={false}
      renderMentions
      mentionUsers={mentionUsers}
      isEditing={false}
      editBody=""
      onEditBodyChange={() => {}}
      onEditStart={() => {}}
      onEditCancel={() => {}}
      onEditSubmit={(e) => e.preventDefault()}
      showDeleteDialog={showDeleteDialog}
      onDeleteDialogChange={setShowDeleteDialog}
      onDeleteConfirm={handleDeleteReply}
      isDeletePending={deleteComment.isPending}
      deleteTitle="Delete reply"
      deleteDescription="Are you sure you want to delete this reply? This action cannot be undone."
      onReply={() => onReply(parentCommentId, replyAuthorName)}
      onShare={handleShareReply}
      onReport={!isReplyAuthor ? handleReportReply : undefined}
      isReportPending={reportMutation.isPending}
      staffMenuSlot={
        <StaffContentActionMenu
          targetType="COMMENT"
          targetId={reply.id}
          targetTitle={`Reply by ${replyAuthorName}`}
          author={replyAuthor}
          isHidden={reply.is_hidden}
          isLocked={reply.is_locked}
          isDeleted={reply.is_deleted}
          variant="icon"
          className="cm-icon-btn min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7"
        />
      }
    />
  );
}

// Single Flat Comment Item Card (with optional inline Level-2 replies)
function FlatCommentItem({
  comment,
  solutionId,
  mentionUsers,
  isThreadLocked = false,
}: {
  comment: Comment;
  solutionId: string;
  mentionUsers?: CommentProfilePreviewUser[];
  isThreadLocked?: boolean;
}) {
  const { user: currentUser } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const voteMutation = useVoteComment();
  const reportMutation = useReport();

  const isAuthor = isContentAuthor(currentUser, comment.author_details, comment.author);
  const repliesRegionId = useId();
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showReplies, setShowReplies] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  // Optimistic vote state derived against latest server props (avoids setState-in-effect)
  const serverVoteCount = comment.vote_count ?? 0;
  const serverUserVote: number | null = comment.user_vote ?? null;
  const [voteOverride, setVoteOverride] = useState<{
    baseCount: number;
    baseVote: number | null;
    count: number;
    vote: number | null;
  } | null>(null);

  const isOverrideCurrent =
    voteOverride !== null &&
    voteOverride.baseCount === serverVoteCount &&
    voteOverride.baseVote === serverUserVote;
  const localVoteCount = isOverrideCurrent ? voteOverride.count : serverVoteCount;
  const localUserVote = isOverrideCurrent ? voteOverride.vote : serverUserVote;

  const author = comment.author_details;
  const authorName = author?.display_name || "solver";
  const replies = comment.replies ?? [];
  const replyCount = replies.length || comment.reply_count || 0;
  const threadMentionUsers = collectCommentParticipants([comment, ...replies], mentionUsers);

  const isCommentUnavailable = Boolean(comment.is_deleted || comment.is_locked || isThreadLocked);
  const effectiveEditing = isEditing && !isCommentUnavailable;
  const effectiveReplying = showReplyForm && !effectiveEditing && !isCommentUnavailable;

  const handleVote = (value: 1 | -1) => {
    if (!currentUser) {
      requireAuth(undefined, { actionLabel: "vote on comments" });
      return;
    }
    if (isAuthor) {
      toast.info("You cannot vote on your own comment.");
      return;
    }
    if (comment.is_deleted || voteMutation.isPending) return;

    const userWeight =
      currentUser?.contributor_tier !== undefined ? currentUser.contributor_tier + 1 : 1;
    const currentVal = localUserVote;
    const currentScore = localVoteCount;
    let newScore = currentScore;
    let newUserVote: number | null = value;

    if (currentVal === value) {
      newUserVote = null;
      newScore = currentScore - value * userWeight;
    } else if (currentVal !== null) {
      newScore = currentScore + (value - currentVal) * userWeight;
    } else {
      newScore = currentScore + value * userWeight;
    }

    setVoteOverride({
      baseCount: serverVoteCount,
      baseVote: serverUserVote,
      count: newScore,
      vote: newUserVote,
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
      // Preserve draft and edit state on failure
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
      // Keep dialog open on failure
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
      // Surfaced via toast.promise
    }
  };

  const handleInlineReplyTrigger = (targetAuthorName: string) => {
    if (isCommentUnavailable) return;
    if (!requireAuth(undefined, { actionLabel: "reply to this comment" })) return;

    if (effectiveEditing) {
      if (editBody.trim() !== comment.body.trim()) {
        toast.info("Save or cancel your edit before replying.");
        return;
      }
      setIsEditing(false);
    }

    const nextMention = `@${targetAuthorName} `;
    if (
      showReplyForm &&
      replyTargetName === targetAuthorName &&
      (!replyBody.trim() || replyBody.trim() === `@${targetAuthorName}`)
    ) {
      setShowReplyForm(false);
      setReplyTargetName(null);
      return;
    }

    setReplyTargetName(targetAuthorName);
    setReplyBody((prev) => {
      if (!prev.trim()) return nextMention;
      if (replyTargetName) {
        const prevPrefix = new RegExp(`^@${escapeRegExp(replyTargetName)}\\s*`);
        if (prevPrefix.test(prev)) {
          return prev.replace(prevPrefix, nextMention);
        }
      }
      return prev.startsWith(nextMention) ? prev : `${nextMention}${prev}`;
    });
    setShowReplyForm(true);
    requestAnimationFrame(() => replyTextareaRef.current?.focus());
  };

  const handleInlineReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || createComment.isPending) return;
    if (!requireAuth(undefined, { actionLabel: "reply to this comment" })) return;

    const promise = createComment.mutateAsync({
      solutionId,
      parentId: comment.id,
      body: replyBody,
    });
    toast.promise(promise, {
      loading: "Posting reply...",
      success: "Reply posted!",
      error: "Failed to post comment.",
    });

    try {
      await promise;
      setReplyBody("");
      setReplyTargetName(null);
      setShowReplyForm(false);
      setShowReplies(true);
    } catch {
      // Keep replyBody and target intact for retry
    }
  };

  return (
    <div className="cm-item-wrap">
      <CommentItemShell
        comment={comment}
        variant="top-level"
        depth={0}
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
          setReplyTargetName(null);
          setEditBody(comment.body);
          setIsEditing(true);
        }}
        onEditCancel={() => {
          setEditBody(comment.body);
          setIsEditing(false);
        }}
        onEditSubmit={handleEditSubmit}
        isEditSubmitting={updateComment.isPending}
        showDeleteDialog={showDeleteDialog}
        onDeleteDialogChange={setShowDeleteDialog}
        onDeleteConfirm={handleDelete}
        isDeletePending={deleteComment.isPending}
        localVoteCount={localVoteCount}
        localUserVote={localUserVote}
        onUpvote={() => handleVote(1)}
        onDownvote={() => handleVote(-1)}
        isVotePending={voteMutation.isPending}
        onReply={() => handleInlineReplyTrigger(authorName)}
        onShare={handleShare}
        onReport={!isAuthor ? handleReport : undefined}
        isReportPending={reportMutation.isPending}
        replyCount={replyCount}
        isRepliesExpanded={showReplies}
        onToggleReplies={() => setShowReplies((prev) => !prev)}
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
            className="cm-icon-btn min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7"
          />
        }
      />

      {effectiveReplying && (
        <div className="cm-inline-reply-slot" data-mobile-clamped="false" data-clamped="false">
          <CommentComposerShell
            compact
            autoFocus
            textareaRef={replyTextareaRef}
            label={`Reply to ${replyTargetName || authorName}`}
            placeholder={`Reply to @${replyTargetName || authorName}...`}
            value={replyBody}
            onChange={setReplyBody}
            onSubmit={handleInlineReplySubmit}
            submitLabel="Post reply"
            submittingLabel="Posting..."
            submitDisabled={!replyBody.trim()}
            isSubmitting={createComment.isPending}
            onCancel={() => {
              setShowReplyForm(false);
              setReplyTargetName(null);
            }}
            cancelLabel="Cancel"
            replyTarget={{ authorName: replyTargetName || authorName }}
            onCancelReply={() => {
              setShowReplyForm(false);
              setReplyTargetName(null);
            }}
          />
        </div>
      )}

      {/* Level 2 Replies directly under this comment */}
      {showReplies && replies.length > 0 && (
        <CommentThreadRail
          id={repliesRegionId}
          depth={0}
          ariaLabel={`Replies to ${authorName}`}
        >
          {replies.map((reply) => (
            <div key={reply.id} role="listitem" className="min-w-0">
              <SolutionReplyItem
                reply={reply}
                parentCommentId={comment.id}
                replyingToName={comment.is_deleted ? null : authorName}
                mentionUsers={threadMentionUsers}
                isThreadLocked={isThreadLocked || Boolean(comment.is_locked)}
                onReply={(_parentId, targetName) => handleInlineReplyTrigger(targetName)}
              />
            </div>
          ))}
        </CommentThreadRail>
      )}
    </div>
  );
}

// =============================================================================
// Main Solution Comments Component
// =============================================================================
function SolutionCommentsContent({
  solutionId,
  totalCount,
  initialCount,
  isLocked = false,
}: {
  solutionId: string;
  totalCount?: number;
  initialCount?: number;
  isLocked?: boolean;
}) {
  const pathname = usePathname();
  const { user: currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded, requireAuth } = useAuthGate();
  const createComment = useCreateComment();
  const { sort: commentSort } = useCommentSort();

  const [body, setBody] = useState("");

  // Fetch top-level comments with preloaded replies in a single request
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isError,
    refetch,
  } = useSolutionComments(solutionId, commentSort);

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  const threadMentionUsers = collectCommentParticipants(comments);
  const totalFromMeta = data?.pages?.[0]?.meta?.total_count;
  const isGuest = isLoaded && !isSignedIn;
  const count =
    typeof totalFromMeta === "number"
      ? totalFromMeta
      : totalCount ?? (isLoading || isError || isGuest ? initialCount : comments.length) ?? 0;
  const encodedRedirect = encodeURIComponent(pathname || "/problems");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || createComment.isPending) return;
    if (!requireAuth(undefined, { actionLabel: "comment on this solution" })) {
      return;
    }
    if (!body.trim()) return;

    const promise = createComment.mutateAsync({
      solutionId,
      body,
    });
    toast.promise(promise, {
      loading: "Posting comment...",
      success: "Comment posted successfully",
      error: "Failed to post comment.",
    });

    try {
      await promise;
      setBody("");
    } catch {
      // Preserve user's draft on failure
    }
  };

  return (
    <CommentModuleRoot>
      <CommentSectionHeader count={count} sortSlot={<CommentSortToggle />} />

      {isLocked ? (
        <CommentLockedBanner />
      ) : (
        <CommentComposerShell
          value={body}
          onChange={setBody}
          onSubmit={handleSubmit}
          onFocus={() => {
            if (isGuest) {
              requireAuth(undefined, { actionLabel: "comment on this solution" });
            }
          }}
          placeholder={
            isGuest
              ? "Sign in to join the discussion..."
              : "Ask a question or leave a thought on this solution..."
          }
          textareaDisabled={createComment.isPending}
          submitDisabled={!isGuest && (!body.trim() || createComment.isPending)}
          isSubmitting={createComment.isPending}
          submitLabel={isGuest ? "Sign in to comment" : "Post comment"}
          submittingLabel="Posting..."
          author={currentUser}
        />
      )}

      {!isLoaded || (Boolean(isSignedIn) && isLoading) ? (
        <CommentSkeletonList count={3} />
      ) : isGuest ? (
        <CommentGuestGate
          hiddenCommentCount={count}
          encodedRedirect={encodedRedirect}
          title="Sign in to view solution discussion"
          description={
            count > 0
              ? `${count} ${count === 1 ? "comment" : "comments"} and peer follow-ups are available after signing in.`
              : "Join E2E for free to read and participate in solution discussions."
          }
        />
      ) : isError ? (
        <CommentErrorState
          title="Could not load solution comments"
          description="There was a problem loading comments for this solution."
          onRetry={() => refetch()}
        />
      ) : comments.length === 0 ? (
        <CommentEmptyState
          title="No comments yet"
          description="Be the first to ask a question or leave feedback for this solution."
        />
      ) : (
        <div className="cm-list" role="list" aria-label="Solution comments">
          {comments.map((comment) => (
            <div key={comment.id} role="listitem" className="min-w-0">
              <FlatCommentItem
                comment={comment}
                solutionId={solutionId}
                mentionUsers={threadMentionUsers}
                isThreadLocked={isLocked}
              />
            </div>
          ))}

          {hasNextPage && (
            <div className="cm-load-more-wrap">
              <button
                type="button"
                className="cm-btn"
                data-variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                )}
                <span>
                  {isFetchingNextPage
                    ? "Loading comments..."
                    : isFetchNextPageError
                      ? "Retry loading more comments"
                      : "Load more comments"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </CommentModuleRoot>
  );
}

export function SolutionComments(props: {
  solutionId: string;
  totalCount?: number;
  initialCount?: number;
  isLocked?: boolean;
}) {
  return (
    <CommentSortProvider initialSort="popular">
      <SolutionCommentsContent {...props} />
    </CommentSortProvider>
  );
}
