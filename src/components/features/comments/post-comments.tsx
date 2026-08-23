"use client";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useTopLevelComments, useCreateComment } from "@/hooks/use-comments";
import { ThreadedComment } from "./threaded-comment";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function PostComments({ postId, initialCount }: { postId: string; initialCount: number }) {
  const { data, fetchNextPage, hasNextPage, isLoading } = useTopLevelComments(postId);
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
      <h2 className="font-display text-2xl text-ink">
        Comments ({displayCount})
      </h2>
      
      <form onSubmit={handleSubmit} className="mt-4 mb-8 space-y-3 rounded-xl border border-line bg-card p-4">
        <textarea
          className={`${inputClass} min-h-24`}
          maxLength={1000}
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" disabled={!body.trim()}>
          Post comment
        </Button>
      </form>

      {isLoading && <div className="text-ink-muted">Loading comments...</div>}
      
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
