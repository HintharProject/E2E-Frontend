"use client";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useTopLevelComments, useCreateComment } from "@/hooks/use-comments";
import { ThreadedComment } from "./threaded-comment";
import { CommentSortProvider, useCommentSort } from "./comment-sort-context";
import { CommentSortToggle } from "./comment-sort-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function PostCommentsContent({ postId, initialCount }: { postId: string; initialCount: number }) {
  const { sort: commentSort } = useCommentSort();
  const { data, fetchNextPage, hasNextPage, isLoading } = useTopLevelComments(postId, commentSort);
  const createComment = useCreateComment();
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    
    const currentBody = body;
    setBody("");

    toast.promise(createComment.mutateAsync({ postId, body: currentBody }), {
      loading: "Posting comment...",
      success: "Comment posted successfully",
      error: (err: any) => {
        setBody(currentBody);
        return "Failed to post comment";
      }
    });
  };

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  const displayCount = data ? comments.length : initialCount;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading font-semibold text-xl text-foreground">
          Comments ({displayCount})
        </h2>
        <CommentSortToggle />
      </div>
      
      <form onSubmit={handleSubmit} className="mt-4 mb-8 space-y-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <Textarea
          className="min-h-24"
          maxLength={1000}
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" disabled={!body.trim()}>
          Post comment
        </Button>
      </form>

      {isLoading && <div className="text-muted-foreground text-sm">Loading comments...</div>}
      
      {comments.length > 0 && (
        <Virtuoso
          useWindowScroll
          data={comments}
          endReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          itemContent={(index, comment) => (
            <ThreadedComment key={comment.id} comment={comment} postId={postId} />
          )}
        />
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
