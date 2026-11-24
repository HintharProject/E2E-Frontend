"use client";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Post } from "@/types";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { SaveButton } from "@/components/features/collections/save-button";
import { ReportModal } from "@/components/features/moderation/report-modal";
import { StaffContentActionMenu } from "@/components/features/moderation/staff-content-action-menu";
import { toast } from "sonner";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

export function PostInteractions({ post }: { post: Post }) {
  const { user: currentUser } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const [reportOpen, setReportOpen] = useState(false);

  const author = post.author_details;

  const handleReport = () => {
    if (!currentUser) {
      requireAuth(undefined, { actionLabel: "report a forum post" });
      return;
    }
    setReportOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {post.post_type !== "ANNOUNCEMENT" ? (
        <VoteWidget
          contentType="posts"
          contentId={post.id}
          initialScore={post.vote_count ?? 0}
          initialUserVote={post.user_vote}
          authorId={author?.id || (typeof post.author === "string" ? post.author : undefined)}
          authorClerkId={author?.clerk_id}
          variant="pill"
        />
      ) : (
        <span className="text-xs text-muted-foreground">
          Voting disabled on announcements
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="min-h-[44px] sm:min-h-0"
        onClick={handleShare}
      >
        Share
      </Button>
      <SaveButton
        entityType="post"
        entityId={post.id}
        variant="ghost"
        size="sm"
        className="min-h-[44px] sm:min-h-0"
        showLabel
        label="Save"
      />
      <Button
        variant="ghost"
        size="sm"
        className="min-h-[44px] sm:min-h-0"
        onClick={handleReport}
      >
        Report
      </Button>

      {/* Staff Inline Moderation Menu */}
      <StaffContentActionMenu
        targetType="POST"
        targetId={post.id}
        targetTitle={post.title}
        author={post.author_details}
        isHidden={post.is_hidden}
        isLocked={post.is_locked}
        isDeleted={post.is_deleted}
        variant="button"
      />

      {/* Global Report Modal */}
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={post.id}
        targetType="POST"
        targetTitle={post.title}
      />
    </div>
  );
}
