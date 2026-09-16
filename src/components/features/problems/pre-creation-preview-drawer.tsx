"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Star, ArrowUpRight, BookOpen, ExternalLink, X } from "lucide-react";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { ContributorTier } from "@/types/contribution";

export interface PreCreationPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
  questionNumber: string;
  existingProblem: {
    id: string;
    title: string;
    status: string;
    is_feed_visible: boolean;
    vote_score?: number;
    solution_count?: number;
  } | null;
  existingSolutions: Array<{
    id: string;
    author: {
      id: string;
      username: string;
      contributor_tier?: number;
      contributor_tier_name?: string;
    };
    body: string;
    vote_score: number;
    is_author_endorsed?: boolean;
    is_accepted?: boolean;
  }>;
  onPromoteToPublic?: () => void;
}

export function PreCreationPreviewDrawer({
  isOpen,
  onClose,
  resourceTitle,
  questionNumber,
  existingProblem,
  existingSolutions,
  onPromoteToPublic,
}: PreCreationPreviewDrawerProps) {
  if (!isOpen || !existingProblem) return null;

  const isPublic = existingProblem.is_feed_visible;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="space-y-2 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand font-semibold text-xs">
              <BookOpen className="size-4" />
            </span>
            <Badge variant="outline" className="text-xs">
              Past Paper Deduplication Check
            </Badge>
            {isPublic ? (
              <Badge variant="default" className="bg-emerald-600 text-white text-xs">
                Active in Feed
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Proactive Solutions Available
              </Badge>
            )}
          </div>

          <DialogTitle className="text-xl font-bold font-display text-ink">
            Existing Discussion Found: {questionNumber}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-muted">
            {resourceTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Informational Callout */}
        <div className="my-4 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-ink">
          {isPublic ? (
            <p>
              A discussion thread already exists for <strong>{questionNumber}</strong> with{" "}
              <strong>{existingSolutions.length} worked {existingSolutions.length === 1 ? "solution" : "solutions"}</strong>.
              Join the conversation to ask questions or review existing step-by-step methods without posting a duplicate.
            </p>
          ) : (
            <p>
              Premade solutions exist from platform contributors. You can promote this question
              to the public Solve! feed to highlight your specific points of confusion.
            </p>
          )}
        </div>

        {/* Existing Solutions List */}
        <div className="space-y-3 my-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Available Worked Solutions ({existingSolutions.length})
          </h4>

          {existingSolutions.length === 0 ? (
            <div className="p-4 text-center text-sm text-ink-muted rounded-xl border border-dashed border-line">
              No solutions submitted yet for this question.
            </div>
          ) : (
            existingSolutions.map((sol) => (
              <div
                key={sol.id}
                className={`p-4 rounded-xl border transition-all ${
                  sol.is_accepted
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-2xs"
                    : "border-line bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">{sol.author.username}</span>
                    {sol.author.contributor_tier !== undefined && (
                      <ContributorBadge
                        tier={sol.author.contributor_tier as ContributorTier}
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sol.is_accepted && (
                      <Badge variant="default" className="bg-emerald-600 text-white text-[10px] h-5 gap-1">
                        <CheckCircle2 className="size-3" /> Accepted
                      </Badge>
                    )}
                    {sol.is_author_endorsed && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px] h-5 gap-1">
                        <Star className="size-3 fill-amber-500 text-amber-500" /> Endorsed (+5)
                      </Badge>
                    )}
                    <span className="text-xs font-bold tabular-nums text-ink-muted">
                      ▲ {sol.vote_score}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed whitespace-pre-line">
                  {sol.body}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-line">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto">
            This Solved My Question — Close
          </Button>

          {isPublic ? (
            <Link
              href={`/problems/${existingProblem.id}`}
              className={buttonVariants({ size: "sm", className: "w-full sm:w-auto gap-1" })}
            >
              Join Existing Discussion <ArrowUpRight className="size-4" />
            </Link>
          ) : (

            <Button
              size="sm"
              onClick={() => {
                onClose();
                onPromoteToPublic?.();
              }}
              className="w-full sm:w-auto gap-1"
            >
              Promote to Public Discussion
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
