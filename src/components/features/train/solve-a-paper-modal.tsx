"use client";

import React, { useState } from "react";
import { Resource } from "@/types";
import { useCreateProblem, useCreateSolution } from "@/hooks/use-problems";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PenTool, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface SolveAPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Resource;
}

export function SolveAPaperModal({ isOpen, onClose, paper }: SolveAPaperModalProps) {
  const [questionNumber, setQuestionNumber] = useState("");
  const [solutionBody, setSolutionBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProblemMutation = useCreateProblem();
  const createSolutionMutation = useCreateSolution();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = questionNumber.trim();
    const cleanBody = solutionBody.trim();

    if (!cleanQ) {
      toast.error("Please provide a question number (e.g. Q3(a)).");
      return;
    }
    if (!cleanBody || cleanBody.length < 10) {
      toast.error("Please provide a comprehensive solution explanation (min 10 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create or find canonical problem with is_feed_visible = false
      const problemTitle = `${paper.subject_details?.name || "Exam"} ${paper.year} ${
        paper.session || ""
      } Paper ${paper.paper_code || ""} — Question ${cleanQ} [Walkthrough]`;

      const problem = await createProblemMutation.mutateAsync({
        origin: "PAST_PAPER",
        resource: paper.id,
        question_number: cleanQ,
        subject: paper.subject,
        level: paper.level,
        title: problemTitle,
        body: `Authoritative worked solution for Question ${cleanQ} of ${paper.file_name}.`,
        is_feed_visible: false,
        uploaded_attachments: [],
      });

      // Step 2: Post solution to problem
      await createSolutionMutation.mutateAsync({
        problemId: problem.id,
        body: cleanBody,
        video_url: videoUrl.trim() || undefined,
        attachments: [],
      });

      toast.success(`Authoritative walkthrough for ${cleanQ} attached to paper!`, {
        icon: <Sparkles className="size-4 text-brand" />,
      });

      onClose();
      setQuestionNumber("");
      setSolutionBody("");
      setVideoUrl("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish paper solution walkthrough.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 rounded-2xl select-none">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-brand/10 text-brand border border-brand/20">
              <PenTool className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-ink">
              Solve a Paper Walkthrough
            </DialogTitle>
            <Badge variant="outline" className="border-brand/40 text-brand text-[10px] font-bold uppercase ml-auto">
              Tier 2+ Pro
            </Badge>
          </div>
          <DialogDescription className="text-xs text-ink-muted">
            Publish authoritative worked solutions directly to this past paper. Walkthroughs
            populate the Train! solution drawers without creating public feed clutter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Target Question Number
            </label>
            <Input
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
              placeholder="e.g. Q3(a) or Q7"
              className="h-9 text-xs bg-surface border-line"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Step-by-Step Solution & Working
            </label>
            <textarea
              value={solutionBody}
              onChange={(e) => setSolutionBody(e.target.value)}
              placeholder="Explain the mathematical steps clearly. LaTeX formulas supported (e.g. $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$)..."
              rows={6}
              className="w-full rounded-md border border-line bg-surface p-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              YouTube Video Walkthrough URL (Optional)
            </label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="h-9 text-xs bg-surface border-line"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="default"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Publishing Walkthrough...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Attach Solution to Paper</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
