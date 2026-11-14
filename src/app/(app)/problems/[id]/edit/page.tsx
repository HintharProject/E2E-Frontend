import Link from "next/link";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function EditProblemPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href={`/problems/${id}`}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to problem
      </Link>

      <div className="rounded-xl border border-warning/30 bg-warning/5 p-8 text-center sm:p-10 shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-warning/15 text-warning mb-5">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Problem Editing Has Been Sunset
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-lg mx-auto">
          To preserve mathematical consensus, peer verification integrity, and the immutable audit ledger, in-place editing of problem statements is permanently disabled.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/80 max-w-md mx-auto">
          If your submission contains critical errors, you may delete the problem if it has not yet reached consensus, or submit a clarifying solution to the community pool.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={`/problems/${id}`}
            className={buttonVariants({ variant: "default" })}
          >
            Return to Problem
          </Link>
        </div>
      </div>
    </div>
  );
}
