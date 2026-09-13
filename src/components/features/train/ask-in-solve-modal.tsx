"use client";

import React, { useState } from "react";
import { Resource } from "@/types";
import { useProblemByPaper, useCreateProblem } from "@/hooks/use-problems";
import { PreCreationPreviewDrawer } from "@/components/features/problems/pre-creation-preview-drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MessageSquare,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface AskInSolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Resource;
}

export function AskInSolveModal({ isOpen, onClose, paper }: AskInSolveModalProps) {
  const [questionNumber, setQuestionNumber] = useState("");
  const [queryTarget, setQueryTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Pre-creation deduplication check hook
  const {
    data: dedupData,
    isLoading: isCheckingDedup,
    isFetching,
  } = useProblemByPaper(paper.id, queryTarget);

  const createProblemMutation = useCreateProblem();

  const handleSearchCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = questionNumber.trim();
    if (!cleanQ) {
      toast.error("Please enter a question number (e.g. Q4 or 4(b)).");
      return;
    }
    setQueryTarget(cleanQ);
  };

  const handlePostQuestion = async () => {
    const cleanQ = questionNumber.trim();
    if (!cleanQ) {
      toast.error("Please specify which question you are asking about.");
      return;
    }

    const defaultTitle = `${paper.subject_details?.name || "Exam"} ${paper.year} ${
      paper.session || ""
    } Paper ${paper.paper_code || ""} — Question ${cleanQ}`;

    const defaultBody =
      notes.trim() ||
      `Seeking step-by-step guidance on Question ${cleanQ} from ${paper.file_name}.`;

    try {
      const created = await createProblemMutation.mutateAsync({
        origin: "PAST_PAPER",
        resource: paper.id,
        question_number: cleanQ,
        subject: paper.subject,
        level: paper.level,
        title: defaultTitle,
        body: defaultBody,
        is_feed_visible: true,
        uploaded_attachments: [],
      });

      toast.success("Question escalated to Solve! Community thread created.", {
        action: {
          label: "View in Solve!",
          onClick: () => {
            window.open(`/solve/${created.id}`, "_blank");
          },
        },
      });

      onClose();
      setQuestionNumber("");
      setQueryTarget("");
      setNotes("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post question to Solve!.";
      toast.error(msg);
    }
  };

  const hasSearched = !!queryTarget && !isFetching;
  const solutionsExist = !!dedupData?.exists && (dedupData.solutions?.length ?? 0) > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <MessageSquare className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-ink">
                Ask in Solve! Q&A
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-ink-muted">
              Instantly discover existing verified solutions for this question, or ask the
              community with zero image upload overhead.
            </DialogDescription>
          </DialogHeader>

          {/* Question Number Input Form */}
          <form onSubmit={handleSearchCheck} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Question Number
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={questionNumber}
                  onChange={(e) => {
                    setQuestionNumber(e.target.value);
                    if (queryTarget && e.target.value !== queryTarget) {
                      setQueryTarget("");
                    }
                  }}
                  placeholder="e.g. Q4 or 3(b)"
                  className="h-9 text-xs bg-surface border-line"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={!questionNumber.trim() || isCheckingDedup}
                  className="h-9 px-3 text-xs font-semibold shrink-0 gap-1.5"
                >
                  {isCheckingDedup ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Search className="size-3.5" />
                  )}
                  <span>Check</span>
                </Button>
              </div>
            </div>

            {/* Deduplication Search Results */}
            {hasSearched && (
              <div className="rounded-xl border p-3 text-xs space-y-2.5 animate-in fade-in-50 duration-150">
                {solutionsExist ? (
                  /* Solutions Found */
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="size-4" />
                      <span>
                        Found {dedupData.solutions.length} existing worked{" "}
                        {dedupData.solutions.length === 1 ? "solution" : "solutions"}!
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      Community members have already worked through this exact question. Review
                      their methods now without waiting:
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Preview Existing Solutions ({dedupData.solutions.length})</span>
                    </Button>
                  </div>
                ) : (
                  /* No Solutions Yet -> Escalate */
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                      <AlertCircle className="size-4" />
                      <span>No community solutions yet for Question {queryTarget}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      Be the first to ask! We will create a discussion thread linked directly to
                      this past paper with zero image cropping needed.
                    </p>

                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted mb-1">
                        What specifically are you struggling with? (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. I got stuck on part (ii) simplifying the quadratic..."
                        rows={2}
                        className="w-full rounded-md border border-line bg-surface p-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      disabled={createProblemMutation.isPending}
                      onClick={handlePostQuestion}
                      className="w-full h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-xs"
                    >
                      {createProblemMutation.isPending ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Posting to Solve!...</span>
                        </>
                      ) : (
                        <>
                          <span>Post Question {queryTarget} to Solve!</span>
                          <ArrowRight className="size-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Slide-over deduplication preview if solutions exist */}
      {dedupData?.problem && (
        <PreCreationPreviewDrawer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          resourceTitle={paper.file_name || "Past Paper"}
          questionNumber={queryTarget}
          existingProblem={dedupData.problem}
          existingSolutions={dedupData.solutions || []}
        />
      )}
    </>
  );
}
