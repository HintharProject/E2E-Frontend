import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReplies, useCreateComment } from "@/hooks/use-comments";
import { Comment } from "@/types";
import { formatDate } from "@/lib/utils";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export function ThreadedComment({
  comment,
  postId
}: {
  comment: Comment;
  postId: string;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const author = comment.author_details;
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useReplies(comment.id);
  const createComment = useCreateComment();

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    createComment.mutate(
      { body: replyBody, parentId: comment.id, postId },
      {
        onSuccess: () => {
          setReplyBody("");
          setShowReplyForm(false);
          setShowReplies(true);
        },
      }
    );
  };

  const replies = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex items-start gap-3">
        <Avatar size="sm">
          {author?.profile_image_url && <AvatarImage src={author?.profile_image_url} />}
          <AvatarFallback>{getInitials(author?.display_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{author?.display_name ?? "Unknown"}</span>
            <span className="text-xs text-ink-muted">{formatDate(comment.created_at)}</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted leading-relaxed">{comment.body}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button variant="ghost" size="xs" onClick={() => setShowReplyForm(!showReplyForm)}>
              Reply
            </Button>
            {comment.reply_count && comment.reply_count > 0 ? (
              <Button variant="ghost" size="xs" onClick={() => setShowReplies(!showReplies)}>
                {showReplies ? "Hide replies" : `View replies (${comment.reply_count})`}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      
      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="ml-10 flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border border-line bg-card px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            placeholder="Write a reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            disabled={createComment.isPending}
          />
          <Button type="submit" size="sm" disabled={createComment.isPending || !replyBody.trim()}>
            Post
          </Button>
        </form>
      )}

      {showReplies && (
        <div className="ml-4 pl-4 border-l-2 border-line flex flex-col gap-2">
          {isLoading && <div className="text-sm text-ink-muted">Loading replies...</div>}
          {replies.map((reply) => (
            <ThreadedComment key={reply.id} comment={reply} postId={postId} />
          ))}
          
          {hasNextPage && (
            <div className="mt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm font-medium"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load more replies..."}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
