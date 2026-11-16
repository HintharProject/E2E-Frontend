"use client";

import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useTopLevelComments, useCreateComment } from "@/hooks/use-comments";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ThreadedComment } from "./threaded-comment";
import { CommentSortProvider, useCommentSort } from "./comment-sort-context";
import { CommentSortToggle } from "./comment-sort-toggle";
import { toast } from "sonner";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import {
  CommentComposerShell,
  CommentEmptyState,
  CommentErrorState,
  CommentGuestGate,
  CommentModuleRoot,
  CommentSectionHeader,
  CommentSkeletonList,
} from "./comment-primitives";

function PostCommentsContent({
  postId,
  initialCount,
}: {
  postId: string;
  initialCount: number;
}) {
  const { sort: commentSort } = useCommentSort();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    refetch,
  } = useTopLevelComments(postId, commentSort);
  const createComment = useCreateComment();
  const { user: currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded, requireAuth } = useAuthGate();
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !requireAuth(undefined, {
        actionLabel: "post a comment",
        redirectUrl: `/posts/${postId}`,
      })
    ) {
      return;
    }
    if (!body.trim()) return;

    const currentBody = body;
    setBody("");

    toast.promise(createComment.mutateAsync({ postId, body: currentBody }), {
      loading: "Posting comment...",
      success: "Comment posted successfully",
      error: () => {
        setBody(currentBody);
        return "Failed to post comment";
      },
    });
  };

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  const totalFromMeta = data?.pages?.[0]?.meta?.total_count;
  const displayCount =
    typeof totalFromMeta === "number"
      ? totalFromMeta
      : Math.max(comments.length, initialCount);
  const isGuest = isLoaded && !isSignedIn;
  const visibleComments = isGuest ? comments.slice(0, 3) : comments;
  const hiddenCommentCount = isGuest
    ? Math.max(displayCount - 3, comments.length - 3, 0)
    : 0;
  const hasMoreLocked = isGuest && (hiddenCommentCount > 0 || Boolean(hasNextPage));
  const encodedRedirect = encodeURIComponent(`/posts/${postId}`);

  return (
    <CommentModuleRoot>
      <CommentSectionHeader count={displayCount} sortSlot={<CommentSortToggle />} />

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
          endReached={() => {
            if (!isGuest && hasNextPage) fetchNextPage();
          }}
          itemContent={(_index, comment) => (
            <div className="pb-2">
              <ThreadedComment key={comment.id} comment={comment} postId={postId} />
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
}: {
  postId: string;
  initialCount: number;
}) {
  return (
    <CommentSortProvider initialSort="popular">
      <PostCommentsContent postId={postId} initialCount={initialCount} />
    </CommentSortProvider>
  );
}
