"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { Resource } from "@/types";
import { apiFetch } from "@/services/api-client";
import { extractApiFieldErrors } from "@/lib/form-errors";
import { isAllowedYouTubeUrl } from "@/lib/upload-rules";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
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
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { MarkdownMathEditor } from "@/components/ui/markdown-math-editor";
import { toast } from "sonner";
import { PenTool, CheckCircle2, Loader2, Sparkles, Video } from "lucide-react";

interface SolveAPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Resource;
}

export function SolveAPaperModal({
  isOpen,
  onClose,
  paper,
}: SolveAPaperModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [questionNumber, setQuestionNumber] = useState("");
  const [solutionBody, setSolutionBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string[]>
  >({});

  const createProblemMutation = useCreateProblem();
  const createSolutionMutation = useCreateSolution();

  const {
    items,
    batchError,
    isUploading,
    isOptimizing,
    addFiles,
    removeFile,
    cancelUpload,
    uploadAll,
    retryItem,
    reset: resetUploads,
  } = useStagedUploads({
    scope: "solution_attachment",
    optimizeImages: true,
  });

  const isSubmitting = submitStage !== "idle";

  useEffect(() => {
    if (!isSubmitting) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [isSubmitting]);

  const focusErrorBanner = () => {
    requestAnimationFrame(() => {
      errorBannerRef.current?.focus();
    });
  };

  const resetFormState = () => {
    resetUploads();
    setQuestionNumber("");
    setSolutionBody("");
    setVideoUrl("");
    setServerError("");
    setServerFieldErrors({});
    setElapsedSeconds(0);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetFormState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = questionNumber.trim();
    const cleanBody = solutionBody.trim();
    const cleanVideo = videoUrl.trim();

    setServerError("");
    setServerFieldErrors({});

    const localFieldErrors: Record<string, string[]> = {};
    if (!cleanQ) {
      localFieldErrors.question_number = [
        "Please provide a question number (e.g. Q3(a)).",
      ];
    } else if (cleanQ.length > 50) {
      localFieldErrors.question_number = [
        "Question number must be 50 characters or fewer.",
      ];
    }

    if (!cleanBody || cleanBody.length < 10) {
      localFieldErrors.body = [
        "Please provide a comprehensive solution explanation (min 10 characters).",
      ];
    } else if (cleanBody.length > 5000) {
      localFieldErrors.body = ["Solution explanation cannot exceed 5000 characters."];
    }

    if (cleanVideo && !isAllowedYouTubeUrl(cleanVideo)) {
      localFieldErrors.video_url = [
        "Must be a valid YouTube URL (youtube.com, youtu.be, or youtube-nocookie.com).",
      ];
    }

    if (Object.keys(localFieldErrors).length > 0) {
      setServerError("Please fix the errors below before publishing.");
      setServerFieldErrors(localFieldErrors);
      focusErrorBanner();
      return;
    }

    if (isOptimizing) {
      setServerError("Please wait for image optimization to finish.");
      focusErrorBanner();
      return;
    }

    setElapsedSeconds(0);
    setSubmitStage(items.length > 0 ? "uploading" : "saving");

    let createdProblemId: string | null = null;

    try {
      // 1. Upload optional diagrams to B2 temp/ BEFORE creating problem
      const uploaded = items.length > 0 ? await uploadAll(getToken) : [];

      setSubmitStage("saving");

      const problemTitle = `${paper.subject_details?.name || "Exam"} ${
        paper.year || ""
      } ${paper.session || ""} ${
        paper.paper_code ? `Paper ${paper.paper_code} ` : ""
      }— Question ${cleanQ} [Walkthrough]`
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 150);

      // 2. Create canonical hidden walkthrough problem
      const problem = await createProblemMutation.mutateAsync({
        origin: "PAST_PAPER",
        resource: paper.id,
        question_number: cleanQ,
        subject: paper.subject,
        level: paper.level,
        title: problemTitle,
        body: `Authoritative worked solution for Question ${cleanQ} of ${
          paper.file_name || paper.title || "Past Paper"
        }.`,
        is_feed_visible: false,
        uploaded_attachments: [],
      });

      createdProblemId = problem.id;

      // 3. Attach solution (backend expects `attachments`)
      await createSolutionMutation.mutateAsync({
        problemId: problem.id,
        body: cleanBody,
        video_url: cleanVideo || null,
        attachments: uploaded.map(({ file_key, file_name }) => ({
          file_key,
          file_name,
        })),
      });

      await queryClient.invalidateQueries({
        queryKey: ["paperProblems", paper.id],
      });

      toast.success(
        `Authoritative walkthrough for ${cleanQ} attached to paper!`,
        {
          icon: <Sparkles className="size-4 text-primary" />,
        }
      );

      resetFormState();
      onClose();
    } catch (err: unknown) {
      // Rollback newly created orphan problem if solution creation failed
      if (createdProblemId) {
        try {
          const token = await getToken();
          if (token) {
            await apiFetch(`/problems/${createdProblemId}/`, token, {
              method: "DELETE",
            });
          }
        } catch {
          // Ignore rollback permission/network errors and preserve root error
        }
        await queryClient.invalidateQueries({
          queryKey: ["paperProblems", paper.id],
        });
      }

      const { serverMessage, fieldErrors } = extractApiFieldErrors(
        err,
        {
          question: "question_number",
          question_number: "question_number",
          body: "body",
          video_url: "video_url",
          attachments: "attachments",
          file: "attachments",
        },
        "Failed to publish paper solution walkthrough."
      );

      setServerError(serverMessage);
      setServerFieldErrors(fieldErrors);
      focusErrorBanner();
    } finally {
      setSubmitStage("idle");
      setElapsedSeconds(0);
    }
  };

  const uploadingIndex = items.findIndex((i) => i.status === "uploading");
  const activeUploadProgress =
    uploadingIndex >= 0 ? items[uploadingIndex]?.progress ?? 0 : 0;

  const submitLabel =
    submitStage === "uploading" && items.length > 0
      ? uploadingIndex >= 0
        ? `Uploading ${uploadingIndex + 1} of ${items.length} (${activeUploadProgress}%)...`
        : "Uploading diagrams..."
      : submitStage === "saving"
        ? "Publishing Walkthrough..."
        : "Attach Solution to Paper";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[94vw] max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-border bg-card shadow-modal">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <PenTool className="size-4" aria-hidden="true" />
            </div>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">
              Solve a Paper Walkthrough
            </DialogTitle>
            <Badge variant="default" className="text-xs font-bold uppercase sm:ml-auto">
              Tier 2+ Pro
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Publish authoritative worked solutions directly to this past paper. Walkthroughs populate the Train! solution drawers without creating public feed clutter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3" noValidate>
          <FormErrorBanner
            ref={errorBannerRef}
            serverMessage={serverError}
            fieldErrors={serverFieldErrors}
          />

          <Field
            label="Target Question Number"
            htmlFor="solve-paper-qnum"
            required
            error={serverFieldErrors.question_number?.[0]}
          >
            <Input
              id="solve-paper-qnum"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
              placeholder="e.g. Q3(a) or Q7"
              disabled={isSubmitting}
              aria-invalid={!!serverFieldErrors.question_number}
              required
            />
          </Field>

          <Field
            label="Step-by-Step Solution & Working"
            htmlFor="solve-paper-body"
            required
            error={serverFieldErrors.body?.[0]}
          >
            <MarkdownMathEditor
              id="solve-paper-body"
              value={solutionBody}
              onChange={setSolutionBody}
              maxLength={5000}
              rows={5}
              disabled={isSubmitting}
              required
              aria-invalid={!!serverFieldErrors.body}
              placeholder="Explain the mathematical steps clearly..."
            />
          </Field>

          <Field
            label="YouTube Video Walkthrough URL (Optional)"
            htmlFor="solve-paper-video"
            description="Supports youtube.com, youtu.be, or youtube-nocookie.com links."
            error={serverFieldErrors.video_url?.[0]}
          >
            <div className="relative">
              <Input
                id="solve-paper-video"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isSubmitting}
                className="pl-9"
                aria-invalid={!!serverFieldErrors.video_url}
              />
              <Video
                className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </Field>

          <Field
            label="Diagrams / Working Photos (Optional · Max 3 · 5MB each)"
            asGroup
          >
            <FileDropzone
              items={items}
              onAddFiles={addFiles}
              onRemoveItem={removeFile}
              onRetryItem={(id) => void retryItem(id, getToken)}
              scope="solution_attachment"
              sizeMode="per-file"
              disabled={isSubmitting}
              label="Upload walkthrough diagrams"
              helperText="Optional: up to 3 images (JPG, PNG, WebP). High-resolution photos up to 25MB are automatically optimized to WebP (<= 5MB final)."
              error={batchError || serverFieldErrors.attachments?.[0]}
            />
          </Field>

          {isSubmitting && elapsedSeconds >= 6 && (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-muted-foreground text-right"
            >
              Server is waking up or finishing transfer — please keep this dialog open.
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            {isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => cancelUpload()}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Cancel Upload
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="default"
              disabled={isSubmitting || isOptimizing}
              className="font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>{submitLabel}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  <span>{submitLabel}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
