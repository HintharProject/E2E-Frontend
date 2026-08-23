import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReplies, useCreateComment, useUpdateComment, useDeleteComment } from "@/hooks/use-comments";
import { useVoteComment } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Comment } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const { user: currentUser } = useCurrentUser();
  const isAuthor = currentUser?.id === comment.author_details?.id;

  const [showReplyForm, setShowReplyForm] = useState(false);
  const hasReplies = Boolean(comment.reply_count && comment.reply_count > 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [localVoteCount, setLocalVoteCount] = useState(comment.vote_count ?? 0);
  const [localUserVote, setLocalUserVote] = useState(comment.user_vote ?? 0);

  const author = comment.author_details;
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useReplies(comment.id, hasReplies);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const voteMutation = useVoteComment();

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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBody.trim()) return;
    updateComment.mutate(
      { commentId: comment.id, body: editBody },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Comment updated successfully.");
        },
        onError: () => toast.error("Failed to update comment."),
      }
    );
  };

  const handleDelete = () => {
    deleteComment.mutate(comment.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        toast.success("Comment deleted.");
      },
      onError: () => toast.error("Failed to delete comment."),
    });
  };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleVote = (value: 1 | -1 | 0) => {
    if (localUserVote === value) return;
    const diff = value - localUserVote;
    setLocalUserVote(value);
    setLocalVoteCount((prev) => prev + diff);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate({ commentId: comment.id, value });
    }, 1000);
  };

  const replies = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex items-start gap-3">
        <Avatar size="sm">
          {author?.profile_image_url && <AvatarImage src={author?.profile_image_url} />}
          <AvatarFallback>{getInitials(author?.display_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">{author?.display_name ?? "Unknown"}</span>
            <span className="text-xs text-ink-muted">{formatDate(comment.created_at)}</span>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mt-2 flex flex-col gap-2">
              <textarea
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand min-h-16"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                disabled={updateComment.isPending}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="xs" onClick={() => { setIsEditing(false); setEditBody(comment.body); }} disabled={updateComment.isPending}>
                  Cancel
                </Button>
                <Button type="submit" size="xs" disabled={updateComment.isPending || !editBody.trim()}>
                  {updateComment.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-1 text-sm text-ink-muted leading-relaxed break-words">{comment.body}</p>
          )}

          {!isEditing && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => handleVote(localUserVote === 1 ? 0 : 1)}
                  className={`text-xs font-semibold transition-colors disabled:opacity-50 ${localUserVote === 1 ? "text-brand" : "text-ink-muted hover:text-brand"}`}
                >
                  ▲
                </button>
                <span className="text-xs font-semibold text-ink-muted">{localVoteCount}</span>
                <button
                  onClick={() => handleVote(localUserVote === -1 ? 0 : -1)}
                  className={`text-xs font-semibold transition-colors disabled:opacity-50 ${localUserVote === -1 ? "text-destructive" : "text-ink-muted hover:text-destructive"}`}
                >
                  ▼
                </button>
              </div>

              <Button variant="ghost" size="xs" onClick={() => setShowReplyForm(!showReplyForm)}>
                Reply
              </Button>

              {isAuthor && (
                <>
                  <Button variant="ghost" size="xs" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="xs" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
                    Delete
                  </Button>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Comment</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this comment? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteComment.isPending}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteComment.isPending}>
                          {deleteComment.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              
              {comment.reply_count && comment.reply_count > 0 ? (
                <Button variant="ghost" size="xs" onClick={() => setShowReplies(!showReplies)}>
                  {showReplies ? "Hide replies" : `View replies (${comment.reply_count})`}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="ml-10 flex flex-col gap-2">
          <textarea
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand min-h-16"
            placeholder="Write a reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            disabled={createComment.isPending}
          />
          <div className="flex justify-end gap-2">
             <Button variant="ghost" size="xs" onClick={() => setShowReplyForm(false)}>
               Cancel
             </Button>
             <Button type="submit" size="xs" disabled={createComment.isPending || !replyBody.trim()}>
               Post
             </Button>
          </div>
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
