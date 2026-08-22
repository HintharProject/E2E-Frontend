import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ThreadedComment({
  authorName,
  authorInitials,
  authorImage,
  content,
  timestamp,
  replies = [],
}: {
  authorName: string;
  authorInitials: string;
  authorImage?: string;
  content: string;
  timestamp: string;
  replies?: React.ReactNode[];
}) {
  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex items-start gap-3">
        <Avatar size="sm">
          {authorImage && <AvatarImage src={authorImage} />}
          <AvatarFallback>{authorInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{authorName}</span>
            <span className="text-xs text-ink-muted">{timestamp}</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted leading-relaxed">{content}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button variant="ghost" size="xs">
              Reply
            </Button>
            <Button variant="ghost" size="xs">
              Upvote
            </Button>
          </div>
        </div>
      </div>
      
      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="ml-4 pl-4 border-l-2 border-line flex flex-col gap-2">
          {replies.map((reply, i) => (
            <div key={i}>{reply}</div>
          ))}
          {/* Mock "Load replies" button */}
          <div className="mt-1">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              Load more replies...
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
