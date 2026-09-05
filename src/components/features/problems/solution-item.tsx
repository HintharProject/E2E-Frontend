"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Solution } from "@/types";
import { formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDeleteSolution } from "@/hooks/use-problems";
import { useAcceptSolution } from "@/hooks/use-contribution";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronRight, CheckCircle2, Check } from "lucide-react";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "");
}

export function SolutionItem({
  solution,
  isProblemAuthor = false,
}: {
  solution: Solution;
  isProblemAuthor?: boolean;
}) {
  const { user } = useCurrentUser();
  const deleteMutation = useDeleteSolution();
  const acceptMutation = useAcceptSolution();

  const author = solution.author_details;
  const isAuthor = user?.id === author?.id;
  const isAdmin = user?.role === "ADMIN";
  const canModify = isAuthor || isAdmin;
  const isAccepted = solution.status === "WORKED";

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/problems/${solution.problem}/solutions/${solution.id}`
      : `/problems/${solution.problem}/solutions/${solution.id}`;

  const handleDelete = async () => {
    toast.promise(deleteMutation.mutateAsync(solution.id), {
      loading: "Deleting solution...",
      success: "Solution deleted successfully",
      error: "Failed to delete solution. Please try again.",
    });
  };

  const handleToggleAccept = (action: "accept" | "unaccept") => {
    acceptMutation.mutate({
      problemId: solution.problem,
      solutionId: solution.id,
      action,
    });
  };

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
        isAccepted
          ? "border-emerald-500/50 bg-emerald-500/5 shadow-xs"
          : "border-line bg-card hover:border-brand/40"
      }`}
    >
      {/* Left Area: Vote Widget + Author & Content Preview */}
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4">
        {/* Vote Widget */}
        <div className="shrink-0">
          <VoteWidget
            contentType="solutions"
            contentId={solution.id}
            initialScore={solution.vote_score ?? solution.vote_count ?? 0}
            initialUserVote={solution.user_vote}
            authorId={author?.id}
            authorClerkId={author?.clerk_id}
            variant="stack"
          />
        </div>

        <div className="h-12 w-px bg-line hidden sm:block" />

        {/* Author details and body preview */}
        <Link
          href={`/problems/${solution.problem}/solutions/${solution.id}`}
          className="flex flex-1 flex-col gap-1.5 cursor-pointer pr-10 sm:pr-0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Avatar size="sm">
              {author?.profile_image_url && <AvatarImage src={author.profile_image_url} />}
              <AvatarFallback>{getInitials(author?.display_name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-ink">{author?.display_name}</span>
            <ContributorBadge tier={author?.contributor_tier} size="sm" />
            <span className="text-xs text-ink-muted">· {formatDate(solution.created_at)}</span>

            {isAccepted && (
              <Badge
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[10px] h-5 ml-1"
              >
                <CheckCircle2 className="size-3" /> Accepted Solution
              </Badge>
            )}
          </div>

          <p className="line-clamp-2 text-sm text-ink-muted">
            {stripHtml(solution.body)}
          </p>
        </Link>
      </div>

      {/* Right Area: Author Actions / Acceptance Flow */}
      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
        {/* Problem Author Accept / Unaccept Checkmark Button */}
        {isProblemAuthor && (
          <div>
            {isAccepted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleAccept("unaccept")}
                disabled={acceptMutation.isPending}
                className="text-xs h-7 gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
              >
                <Check className="size-3.5" /> Accepted (Undo)
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={acceptMutation.isPending}
                      className="text-xs h-7 gap-1 hover:border-emerald-500 hover:text-emerald-600"
                    >
                      <Check className="size-3.5" /> Accept Solution
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-emerald-500" />
                      Accept this Solution?
                    </DialogTitle>
                    <DialogDescription>
                      Marking <strong>{author?.display_name || "this user"}&apos;s</strong> solution as accepted will mark this problem as <strong>SOLVED</strong> and reward <strong>+10 milestone points</strong> to you.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="secondary" />}>
                      Cancel
                    </DialogClose>
                    <DialogClose
                      render={
                        <Button
                          variant="default"
                          onClick={() => handleToggleAccept("accept")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        />
                      }
                    >
                      Confirm & Accept (+10 pts)
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        <Link
          href={`/problems/${solution.problem}/solutions/${solution.id}`}
          className="flex items-center text-brand font-medium text-xs gap-1 group-hover:underline"
        >
          View details <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Three-dot more menu */}
      <div className="absolute right-3 top-3">
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="SOLUTION"
          contentId={solution.id}
          editHref={canModify ? `/problems/${solution.problem}/solutions/${solution.id}/edit` : undefined}
          onDelete={canModify ? handleDelete : undefined}
          deleteLabel="this solution"
        />
      </div>
    </div>
  );
}
