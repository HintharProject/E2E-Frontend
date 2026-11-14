"use client";

import Link from "next/link";
import { Plus, FileText, PenLine, ShieldCheck, Layers, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <PenLine className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Path A · Original Question</p>
              <p className="text-muted-foreground leading-snug">
                Write LaTeX equations or attach worked sketches.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
            <FileText className="mt-0.5 size-3.5 shrink-0 text-warning" />
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
          render={<Link href="/problems/new" />}
        >
          <Plus className="size-4" />
          New Problem Thread
        </Button>
      </div>

      {/* How Solve! Consensus Works Reference Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h2 className="font-heading text-sm font-semibold text-foreground tracking-tight">
            How Solve! Consensus Works
          </h2>
        </div>

        <ul className="space-y-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <Layers className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              <strong className="font-medium text-foreground">
                <span className="font-mono tabular-nums">7</span>-Slot Solution Pool:
              </strong>{" "}
              Only the top active solutions stay pinned per thread.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              <strong className="font-medium text-foreground">Tier 2+ Eviction:</strong>{" "}
              Full pools replace lowest zero-vote, unendorsed entries via Tier 2+ contributors.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span>
              <strong className="font-medium text-foreground">
                <span className="font-mono tabular-nums">+10</span> pt Reward:
              </strong>{" "}
              Awarded when an author endorses or consensus marks a worked solution.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span>
              <strong className="font-medium text-foreground">
                <span className="font-mono tabular-nums">48h</span> FINAL Lock:
              </strong>{" "}
              Endorsed solutions lock into canonical archive after 48 hours.
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
}

