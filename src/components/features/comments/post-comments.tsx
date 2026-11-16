"use client";

import React, { forwardRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { useTopLevelComments, useCreateComment } from "@/hooks/use-comments";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ThreadedComment } from "./threaded-comment";
import { CommentSortProvider, useCommentSort } from "./comment-sort-context";
import { CommentSortToggle } from "./comment-sort-toggle";
import { toast } from "sonner";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import {
  collectCommentParticipants,
  CommentComposerShell,
  CommentEmptyState,
  CommentErrorState,
  CommentGuestGate,
  CommentLockedBanner,
  CommentModuleRoot,
  CommentSectionHeader,
  CommentSkeletonList,
} from "./comment-primitives";

const VirtuosoCommentList = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function VirtuosoCommentList({ style, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="list"
        aria-label="Forum comments"
        style={style}
        {...props}
      />
    );
  }
);

function PostCommentsContent({
  postId,
  initialCount,
  isLocked = false,
}: {
  postId: string;
  initialCount: number;
  isLocked?: boolean;
}) {
  const { sort: commentSort } = useCommentSort();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isError,
    refetch,
  } = useTopLevelComments(postId, commentSort);
  const createComment = useCreateComment();
  const { user: currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded, requireAuth } = useAuthGate();
  const [body, setBody] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || createComment.isPending) return;
    if (
      !requireAuth(undefined, {
        actionLabel: "post a comment",
        redirectUrl: `/posts/${postId}`,
      })
    ) {
      return;
    }
    if (!body.trim()) return;

    const promise = createComment.mutateAsync({ postId, body });
    toast.promise(promise, {
      loading: "Posting comment...",
      success: "Comment posted successfully",
      error: "Failed to post comment",
    });

    try {
      await promise;
      setBody("");
    } catch {
      // Preserve draft in composer on failure
    }
  };

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  const totalFromMeta = data?.pages?.[0]?.meta?.total_count;
  const displayCount =
    typeof totalFromMeta === "number"
      ? totalFromMeta
      : isLoading || isError
        ? initialCount
        : comments.length;
  const isGuest = isLoaded && !isSignedIn;
  const visibleComments = isGuest ? comments.slice(0, 3) : comments;
  const threadMentionUsers = collectCommentParticipants(visibleComments);
  const hiddenCommentCount = isGuest
    ? Math.max(displayCount - 3, comments.length - 3, 0)
    : 0;
  const hasMoreLocked = isGuest && (hiddenCommentCount > 0 || Boolean(hasNextPage));
  const encodedRedirect = encodeURIComponent(`/posts/${postId}`);

  return (
    <CommentModuleRoot>
      <CommentSectionHeader count={displayCount} sortSlot={<CommentSortToggle />} />

      {isLocked ? (
        <CommentLockedBanner />
      ) : (
        <CommentComposerShell
          value={body}
          onChange={setBody}
          onSubmit={handleSubmit}
          onFocus={() => {
            if (isGuest) {
              requireAuth(undefined, {
                actionLabel: "comment on this thread",
                redirectUrl: `/posts/${postId}`,
              });
            }
          }}
          maxLength={1000}
          placeholder={isGuest ? "Sign in to write a comment..." : "Write a comment..."}
          submitLabel={isGuest ? "Sign in to comment" : "Post comment"}
          submitDisabled={!isGuest && !body.trim()}
          isSubmitting={createComment.isPending}
          author={currentUser}
        />
      )}

      {isLoading && <CommentSkeletonList count={3} />}

      {!isLoading && isError && (
        <CommentErrorState
          title="Could not load comments"
          description="There was a problem fetching this discussion. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && visibleComments.length === 0 && (
        <CommentEmptyState
          title="No comments yet"
          description="Be the first to share a perspective or follow-up question on this thread."
        />
      )}

      {visibleComments.length > 0 && (
        <Virtuoso
          useWindowScroll
          data={visibleComments}
          computeItemKey={(_index, comment) => comment.id}
          endReached={() => {
            if (!isGuest && hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          components={{
            List: VirtuosoCommentList,
            Footer: () => {
              if (isGuest) return null;
              if (isFetchingNextPage) {
                return (
                  <div className="cm-load-more-wrap" role="status" aria-label="Loading more comments">
                    <span className="cm-action-btn">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      <span>Loading more comments...</span>
                    </span>
                  </div>
                );
              }
              if (isFetchNextPageError && hasNextPage) {
                return (
                  <div className="cm-load-more-wrap">
                    <button
                      type="button"
                      className="cm-btn"
                      data-variant="outline"
                      onClick={() => fetchNextPage()}
                    >
                      Retry loading more comments
                    </button>
                  </div>
                );
              }
              return null;
            },
          }}
          itemContent={(_index, comment) => (
            <div role="listitem" className="pb-2 min-w-0">
              <ThreadedComment
                comment={comment}
                postId={postId}
                mentionUsers={threadMentionUsers}
                isThreadLocked={isLocked}
              />
            </div>
          )}
        />
      )}

      {hasMoreLocked && (
        <CommentGuestGate
          hiddenCommentCount={hiddenCommentCount}
          encodedRedirect={encodedRedirect}
        />
      )}
    </CommentModuleRoot>
  );
}

export function PostComments({
  postId,
  initialCount,
  isLocked = false,
}: {
  postId: string;
  initialCount: number;
  isLocked?: boolean;
}) {
  return (
    <CommentSortProvider initialSort="popular">
      <PostCommentsContent
        postId={postId}
        initialCount={initialCount}
        isLocked={isLocked}
      />
    </CommentSortProvider>
  );
}
