"use client";

import Link from "next/link";
import { Plus, FileText, PenLine, ShieldCheck, Layers, Sparkles, ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GatedLink } from "@/components/features/auth/gated-link";

export function ProblemsRightRail() {
  return (
    <aside aria-label="Solve actions and rules" className="hidden xl:block w-72 shrink-0 space-y-4">
      {/* Ask a Question CTA Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
        <div className="space-y-1.5">
          <h2 className="font-heading text-base font-semibold text-foreground tracking-tight">
            Ask a Question
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Get step-by-step worked solutions from peers and Tiered Contributors.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
            <PenLine className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Path A · Original Question</p>
              <p className="text-muted-foreground leading-snug">
                Write LaTeX equations or attach worked sketches.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
            <FileText className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Path B · Past Paper Cite</p>
              <p className="text-muted-foreground leading-snug">
                Link year, session &amp; question number directly to Train!.
              </p>
            </div>
          </div>
        </div>

        <Button
          className="w-full gap-1.5"
          size="sm"
          nativeButton={false}
          render={<GatedLink href="/problems/new" actionLabel="post a problem in Solve!" />}
        >
          <Plus className="size-4" aria-hidden="true" />
          New Problem Thread
        </Button>
      </div>

      {/* How Confidence & Solutions Work Reference Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-sm font-semibold text-foreground tracking-tight">
            How Confidence &amp; Solutions Work
          </h2>
        </div>

        <ul className="space-y-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <Layers className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="font-medium text-foreground">Unlimited Solutions:</strong>{" "}
              Any member can submit worked solutions. Heavily downvoted entries (&le; -5) collapse cleanly.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>
              <strong className="font-medium text-foreground">
                <span className="font-mono tabular-nums">0–100%</span> Confidence:
              </strong>{" "}
              Combines top distinct-author solution scores, peer corroboration, and thread stability.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span>
              <strong className="font-medium text-foreground">
                <span className="font-mono tabular-nums">3×</span> Author Upvote:
              </strong>{" "}
              Problem authors boost helpful community solutions at{" "}
              <span className="font-mono tabular-nums">3×</span> their tier weight (+3 to +15).
            </span>
          </li>
        </ul>

        <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5 text-xs">
          <Link
            href="/problems?confidence=needs_help"
            className="inline-flex items-center justify-between text-muted-foreground hover:text-primary transition-colors py-0.5"
          >
            <span>Browse Needs Help (&lt;50%)</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/problems?confidence=high"
            className="inline-flex items-center justify-between text-muted-foreground hover:text-primary transition-colors py-0.5"
          >
            <span>Browse High Confidence (80%+)</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
