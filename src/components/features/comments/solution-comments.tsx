"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  useSolutionComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/use-comments";
import { useVoteComment, useReport } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { Comment } from "@/types";
import { toast } from "sonner";
import { StaffContentActionMenu } from "@/components/features/moderation/staff-content-action-menu";
import { CommentSortProvider, useCommentSort } from "./comment-sort-context";
import { CommentSortToggle } from "./comment-sort-toggle";
import {
  CommentComposerShell,
  CommentEmptyState,
  CommentErrorState,
  CommentItemShell,
  CommentModuleRoot,
  CommentSectionHeader,
  CommentSkeletonList,
  CommentThreadRail,
} from "./comment-primitives";

// Single Level-2 Reply Item (delegates deletion confirmation safely while preserving exact handler)
function SolutionReplyItem({
  reply,
  parentCommentId,
  onReply,
}: {
  reply: Comment;
  parentCommentId: string;
  onReply: (parentId: string, authorName: string) => void;
}) {
  const { user: currentUser } = useCurrentUser();
  const deleteComment = useDeleteComment();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const replyAuthor = reply.author_details;
  const isReplyAuthor = isContentAuthor(currentUser, replyAuthor, reply.author);

  const handleDeleteReply = () => {
    setShowDeleteDialog(false);
    toast.promise(deleteComment.mutateAsync(reply.id), {
      loading: "Deleting reply...",
      success: "Reply deleted.",
      error: "Failed to delete reply.",
    });
  };

  return (
    <CommentItemShell
      comment={reply}
      variant="nested"
      isAuthor={isReplyAuthor}
      canEdit={false}
      renderMentions
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
      deleteTitle="Delete Reply"
      deleteDescription="Are you sure you want to delete this reply? This action cannot be undone."
      onReply={() => onReply(parentCommentId, replyAuthor?.display_name || "solver")}
      staffMenuSlot={
        <StaffContentActionMenu
          targetType="COMMENT"
          targetId={reply.id}
          targetTitle={`Reply by ${replyAuthor?.display_name || "User"}`}
          author={replyAuthor}
          isHidden={reply.is_hidden}
          isLocked={reply.is_locked}
          isDeleted={reply.is_deleted}
          variant="icon"
          className="h-6 w-6"
        />
      }
    />
  );
}

// Single Flat Comment Item Card (with optional inline Level-2 replies)
function FlatCommentItem({
  comment,
  solutionId,
}: {
  comment: Comment;
  solutionId: string;
}) {
  const { user: currentUser } = useCurrentUser();
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const voteMutation = useVoteComment();
  const reportMutation = useReport();

  const isAuthor = isContentAuthor(currentUser, comment.author_details, comment.author);

  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showReplies, setShowReplies] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  // Local optimistic vote state
  const [localVoteCount, setLocalVoteCount] = useState(comment.vote_count ?? 0);
  const [localUserVote, setLocalUserVote] = useState<number | null>(comment.user_vote ?? null);

  useEffect(() => {
    setLocalVoteCount(comment.vote_count ?? 0);
    setLocalUserVote(comment.user_vote ?? null);
  }, [comment.vote_count, comment.user_vote]);

  const author = comment.author_details;
  const replies = comment.replies ?? [];
  const replyCount = replies.length || comment.reply_count || 0;

  const handleVote = (value: 1 | -1) => {
    if (!currentUser) {
      toast.error("You must be logged in to vote.");
      return;
    }
    if (isAuthor) {
      toast.info("You cannot vote on your own comment.");
      return;
    }
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

  const handleInlineReplyTrigger = (targetAuthorName: string) => {
    if (!currentUser) {
      toast.error("Please log in to comment.");
      return;
    }
    setReplyTargetName(targetAuthorName);
    const mention = `@${targetAuthorName} `;
    if (!replyBody.includes(mention)) {
      setReplyBody((prev) => (prev ? `${mention}${prev}` : mention));
    }
    setShowReplyForm(true);
  };

  const handleInlineReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    if (!currentUser) {
      toast.error("Please log in to comment.");
      return;
    }

    const currentText = replyBody;
    const savedTarget = replyTargetName;
    setReplyBody("");
    setReplyTargetName(null);
    setShowReplyForm(false);
    setShowReplies(true);

    toast.promise(
      createComment.mutateAsync({
        solutionId,
        parentId: comment.id,
        body: currentText,
      }),
      {
        loading: "Posting reply...",
        success: "Reply posted!",
        error: () => {
          setReplyBody(currentText);
          setReplyTargetName(savedTarget);
          setShowReplyForm(true);
          return "Failed to post comment.";
        },
      }
    );
  };

  return (
    <div className="cm-item-wrap">
      <CommentItemShell
        comment={comment}
        variant="top-level"
        isAuthor={isAuthor}
        renderMentions
        isEditing={isEditing}
        editBody={editBody}
        onEditBodyChange={setEditBody}
        onEditStart={() => {
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
        onReply={() => handleInlineReplyTrigger(author?.display_name || "solver")}
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
            className="h-6 w-6"
          />
        }
      />

      {showReplyForm && (
        <div className="cm-inline-reply-slot">
          <CommentComposerShell
            compact
            autoFocus
            label={`Reply to ${replyTargetName || author?.display_name || "comment"}`}
            placeholder={`Reply to @${replyTargetName || author?.display_name || "solver"}...`}
            value={replyBody}
            onChange={setReplyBody}
            onSubmit={handleInlineReplySubmit}
            submitLabel="Post Reply"
            submittingLabel="Posting..."
            submitDisabled={!replyBody.trim()}
            isSubmitting={createComment.isPending}
            onCancel={() => {
              setShowReplyForm(false);
              setReplyTargetName(null);
            }}
            cancelLabel="Cancel"
            replyTarget={{ authorName: replyTargetName || author?.display_name || "solver" }}
            onCancelReply={() => {
              setShowReplyForm(false);
              setReplyTargetName(null);
            }}
          />
        </div>
      )}

      {/* Level 2 Replies directly under this comment */}
      {showReplies && replies.length > 0 && (
        <CommentThreadRail>
          {replies.map((reply) => (
            <SolutionReplyItem
              key={reply.id}
              reply={reply}
              parentCommentId={comment.id}
              onReply={(_parentId, targetName) => handleInlineReplyTrigger(targetName)}
            />
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
}: {
  solutionId: string;
  totalCount?: number;
  initialCount?: number;
}) {
  const { user: currentUser } = useCurrentUser();
  const createComment = useCreateComment();
  const { sort: commentSort } = useCommentSort();

  const [body, setBody] = useState("");

  // Fetch top-level comments with preloaded replies in a single request
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useSolutionComments(solutionId, commentSort);

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  const count = totalCount ?? initialCount ?? comments.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    if (!currentUser) {
      toast.error("Please log in to comment.");
      return;
    }

    const currentText = body;
    setBody("");

    toast.promise(
      createComment.mutateAsync({
        solutionId,
        body: currentText,
      }),
      {
        loading: "Posting comment...",
        success: "Comment posted!",
        error: () => {
          setBody(currentText);
          return "Failed to post comment.";
        },
      }
    );
  };

  return (
    <CommentModuleRoot>
      <CommentSectionHeader count={count} sortSlot={<CommentSortToggle />} />

      <CommentComposerShell
        value={body}
        onChange={setBody}
        onSubmit={handleSubmit}
        placeholder={
          currentUser
            ? "Ask a question or leave a thought on this solution..."
            : "Log in to join the discussion..."
        }
        textareaDisabled={!currentUser || createComment.isPending}
        submitDisabled={!currentUser || !body.trim() || createComment.isPending}
        isSubmitting={createComment.isPending}
        submitLabel="Post Comment"
        submittingLabel="Posting..."
        author={currentUser}
      />

      {isLoading ? (
        <CommentSkeletonList count={3} />
      ) : isError ? (
        <CommentErrorState
          title="Could not load solution comments"
          description={
            currentUser
              ? "There was a problem loading comments for this solution."
              : "Sign in to view and participate in solution comments."
          }
          onRetry={() => refetch()}
        />
      ) : comments.length === 0 ? (
        <CommentEmptyState
          title="No comments yet"
          description="Be the first to ask a question or leave feedback for this solution!"
        />
      ) : (
        <div className="cm-list">
          {comments.map((comment) => (
            <FlatCommentItem
              key={comment.id}
              comment={comment}
              solutionId={solutionId}
            />
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
                <span>{isFetchingNextPage ? "Loading comments..." : "Load More Comments"}</span>
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
}) {
  return (
    <CommentSortProvider initialSort="popular">
      <SolutionCommentsContent {...props} />
    </CommentSortProvider>
  );
}
