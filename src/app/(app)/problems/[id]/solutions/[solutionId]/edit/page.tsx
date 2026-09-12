"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function EditSolutionPage({
  params,
}: {
  params: Promise<{ id: string; solutionId: string }>;
}) {
  const { id: problemId } = use(params);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href={`/problems/${problemId}`}
        className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink mb-6 transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to problem
      </Link>

      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-8 text-center sm:p-10 shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning mb-5">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Solution Editing Has Been Sunset
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted max-w-lg mx-auto">
          To maintain verification integrity, prevent retroactive vote manipulation, and guarantee consensus finality, worked solutions cannot be modified after submission.
        </p>
        <p className="mt-2 text-xs text-ink-muted/80 max-w-md mx-auto">
          If you have developed an improved proof, a correction, or an alternative derivation, submit a new candidate solution to the active 7-slot pool.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={`/problems/${problemId}`}
            className={buttonVariants({ variant: "default" })}
          >
            Return to Problem
          </Link>
        </div>
      </div>
    </div>
  );
}
