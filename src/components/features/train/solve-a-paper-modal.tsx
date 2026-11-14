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
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
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

      await createSolutionMutation.mutateAsync({
        problemId: problem.id,
        body: cleanBody,
        video_url: videoUrl.trim() || undefined,
        attachments: [],
      });

      toast.success(`Authoritative walkthrough for ${cleanQ} attached to paper!`, {
        icon: <Sparkles className="size-4 text-primary" />,
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
      <DialogContent className="w-[94vw] max-w-lg sm:max-w-lg p-6 rounded-2xl border border-border bg-card shadow-modal">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border pr-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <PenTool className="size-4" aria-hidden="true" />
            </div>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">
              Solve a Paper Walkthrough
            </DialogTitle>
            <Badge variant="default" className="text-xs font-bold uppercase ml-auto">
              Tier 2+ Pro
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Publish authoritative worked solutions directly to this past paper. Walkthroughs populate the Train! solution drawers without creating public feed clutter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <Field label="Target Question Number" htmlFor="solve-paper-qnum" required>
            <Input
              id="solve-paper-qnum"
              sizeVariant="sm"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
              placeholder="e.g. Q3(a) or Q7"
              required
            />
          </Field>

          <Field label="Step-by-Step Solution & Working" htmlFor="solve-paper-body" required>
            <Textarea
              id="solve-paper-body"
              value={solutionBody}
              onChange={(e) => setSolutionBody(e.target.value)}
              placeholder="Explain the mathematical steps clearly. LaTeX formulas supported (e.g. $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$)..."
              rows={6}
              className="text-xs font-mono min-h-[140px]"
              required
            />
          </Field>

          <Field label="YouTube Video Walkthrough URL (Optional)" htmlFor="solve-paper-video">
            <Input
              id="solve-paper-video"
              sizeVariant="sm"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </Field>

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
              className="font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Publishing Walkthrough...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
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
