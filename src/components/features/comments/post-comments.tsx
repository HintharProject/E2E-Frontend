"use client";
import { useState } from "react";
import Link from "next/link";
import { Virtuoso } from "react-virtuoso";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { useTopLevelComments, useCreateComment } from "@/hooks/use-comments";
import { ThreadedComment } from "./threaded-comment";
import { CommentSortProvider, useCommentSort } from "./comment-sort-context";
import { CommentSortToggle } from "./comment-sort-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

function PostCommentsContent({ postId, initialCount }: { postId: string; initialCount: number }) {
  const { sort: commentSort } = useCommentSort();
  const { data, fetchNextPage, hasNextPage, isLoading } = useTopLevelComments(postId, commentSort);
  const createComment = useCreateComment();
  const { isSignedIn, isLoaded, requireAuth } = useAuthGate();
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth(undefined, { actionLabel: "post a comment", redirectUrl: `/posts/${postId}` })) {
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
      }
    });
  };

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  const totalFromMeta = data?.pages?.[0]?.meta?.total_count;
  const displayCount = typeof totalFromMeta === "number" ? totalFromMeta : Math.max(comments.length, initialCount);
  const isGuest = isLoaded && !isSignedIn;
  const visibleComments = isGuest ? comments.slice(0, 3) : comments;
  const hiddenCommentCount = isGuest
    ? Math.max(displayCount - 3, comments.length - 3, 0)
    : 0;
  const hasMoreLocked = isGuest && (hiddenCommentCount > 0 || Boolean(hasNextPage));
  const encodedRedirect = encodeURIComponent(`/posts/${postId}`);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading font-semibold text-xl text-foreground">
          Comments (<span className="font-mono tabular-nums">{displayCount}</span>)
        </h2>
        <CommentSortToggle />
      </div>
      
      <form onSubmit={handleSubmit} className="mt-4 mb-8 space-y-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <Textarea
          className="min-h-24"
          maxLength={1000}
          placeholder={isGuest ? "Sign in to write a comment..." : "Write a comment..."}
          value={body}
          onFocus={() => {
            if (isGuest) {
              requireAuth(undefined, {
                actionLabel: "comment on this thread",
                redirectUrl: `/posts/${postId}`,
              });
            }
          }}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" disabled={!isGuest && !body.trim()}>
          {isGuest ? "Sign in to comment" : "Post comment"}
        </Button>
      </form>

      {isLoading && <div className="text-muted-foreground text-sm">Loading comments...</div>}
      
      {visibleComments.length > 0 && (
        <Virtuoso
          useWindowScroll
          data={visibleComments}
          endReached={() => {
            if (!isGuest && hasNextPage) fetchNextPage();
          }}
          itemContent={(index, comment) => (
            <ThreadedComment key={comment.id} comment={comment} postId={postId} />
          )}
        />
      )}

      {hasMoreLocked && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Lock className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Showing top 3 public comments
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {hiddenCommentCount > 0
                  ? `${hiddenCommentCount} more ${hiddenCommentCount === 1 ? "comment" : "comments"} and nested replies are available after signing in.`
                  : "More comments and nested replies are available after signing in."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/sign-up?redirect_url=${encodedRedirect}`}
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "min-h-[40px] md:min-h-[36px] gap-1.5 font-semibold",
              })}
            >
              <UserPlus className="size-3.5" aria-hidden="true" />
              <span>Sign up free</span>
            </Link>
            <Link
              href={`/sign-in?redirect_url=${encodedRedirect}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "min-h-[40px] md:min-h-[36px] gap-1.5 font-semibold",
              })}
            >
              <LogIn className="size-3.5" aria-hidden="true" />
              <span>Log in</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export function PostComments({ postId, initialCount }: { postId: string; initialCount: number }) {
  return (
    <CommentSortProvider initialSort="popular">
      <PostCommentsContent postId={postId} initialCount={initialCount} />
    </CommentSortProvider>
  );
}
