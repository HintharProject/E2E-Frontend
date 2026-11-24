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
import { ArrowUpRight, BookOpen, UserCheck } from "lucide-react";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { ConfidenceBadge } from "@/components/features/problems/confidence-badge";
import type { ConfidenceBand } from "@/types";

export interface PreCreationPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
  questionNumber: string;
  existingProblem: {
    id: string;
    title: string;
    is_feed_visible: boolean;
    vote_score?: number;
    solution_count?: number;
    resolution_confidence?: number;
    confidence_band?: ConfidenceBand;
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
    is_author_solution?: boolean;
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
        <DialogHeader className="space-y-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            <Badge variant="outline" className="text-xs">
              Past Paper Deduplication Check
            </Badge>
            {isPublic ? (
              <Badge variant="default" className="text-xs">
                Active in Feed
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Proactive Solutions Available
              </Badge>
            )}
            {typeof existingProblem.resolution_confidence === "number" && (
              <ConfidenceBadge
                confidence={existingProblem.resolution_confidence}
                band={existingProblem.confidence_band}
                size="sm"
              />
            )}
          </div>

          <DialogTitle className="text-xl font-bold font-display text-foreground">
            Existing Discussion Found: {questionNumber}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {resourceTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Informational Callout */}
        <div className="my-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
          {isPublic ? (
            <p>
              A discussion thread already exists for <strong>{questionNumber}</strong> with{" "}
              <strong className="font-mono tabular-nums">{existingSolutions.length}</strong> worked {existingSolutions.length === 1 ? "solution" : "solutions"}.
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
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available Worked Solutions (<span className="font-mono tabular-nums">{existingSolutions.length}</span>)
          </h4>

          {existingSolutions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border">
              No solutions submitted yet for this question.
            </div>
          ) : (
            existingSolutions.map((sol) => (
              <div
                key={sol.id}
                className="p-4 rounded-xl border border-border bg-card transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{sol.author.username}</span>
                    <ContributorBadge
                      tier={sol.author.contributor_tier ?? 0}
                      size="sm"
                      interactive={false}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sol.is_author_solution && (
                      <Badge variant="outline" className="border-primary/40 text-primary text-xs h-5 gap-1">
                        <UserCheck className="size-3" aria-hidden="true" /> Problem Author
                      </Badge>
                    )}
                    <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
                      ▲ {sol.vote_score}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line">
                  {sol.body}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
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
