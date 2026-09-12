"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Solution } from "@/types";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm, extractApiFieldErrors } from "@/lib/form-errors";
import { generateProblemUploadUrl } from "@/hooks/use-problems";
import { AlertCircle, Info, Sparkles, Video } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formSchema = z.object({
  body: z.string().min(10, "Solution description must be at least 10 characters").max(5000, "Max 5000 characters"),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  attachments: z
    .any()
    .optional()
    .refine((files) => !files || files.length <= 3, "Max 3 files allowed.")
    .refine(
      (files) => !files || Array.from(files as File[]).every((file) => file.size <= MAX_FILE_SIZE),
      "Max file size is 5MB per file."
    )
    .refine(
      (files) => !files || Array.from(files as File[]).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only .jpg, .png, and .webp formats are supported."
    ),
});

type FormValues = z.infer<typeof formSchema>;

export interface CreateSolutionFormProps {
  problemId: string;
  isSolved: boolean;
  isClosed?: boolean;
  activePoolCount?: number;
  canEvict?: boolean;
  isPoolLocked?: boolean;
}

export function CreateSolutionForm({
  problemId,
  isSolved,
  isClosed = false,
  activePoolCount = 0,
  canEvict = false,
  isPoolLocked = false,
}: CreateSolutionFormProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const submissionKey = `create_solution_${problemId}`;
  const { getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      body: "",
      video_url: "",
    },
  });

  // Recover state and field errors if submission failed
  useEffect(() => {
    const failed = getFailedSubmission(submissionKey);
    if (failed) {
      if (failed.formValues) {
        reset(failed.formValues as FormValues);
      }
      if (failed.files && failed.files.length > 0) {
        setValue("attachments", failed.files, { shouldValidate: true });
      }
      if (failed.serverMessage) {
        setServerError(failed.serverMessage);
      }
      if (failed.fieldErrors) {
        setServerFieldErrors(failed.fieldErrors);
        applyFieldErrorsToForm(failed.fieldErrors, setError);
      }
      clearFailedSubmission(submissionKey);
    }
  }, [getFailedSubmission, clearFailedSubmission, submissionKey, reset, setValue, setError]);

  if (isClosed) {
    return (
      <div className="rounded-xl border border-line bg-muted/20 p-6 text-center text-sm text-ink-muted">
        This discussion thread has been closed by moderation. New solutions cannot be posted.
      </div>
    );
  }

  // Capacity Gating UI when 7/7 active slots are filled
  if (activePoolCount >= 7) {
    if (!canEvict) {
      return (
        <div className="rounded-xl border border-line bg-card p-6 text-center shadow-xs">
          <AlertCircle className="size-8 text-amber-500 mx-auto mb-2" />
          <h4 className="font-semibold text-ink text-sm">Solution Pool Capacity Reached (7/7)</h4>
          <p className="mt-1 text-xs text-ink-muted max-w-md mx-auto">
            The active solution pool is full. Submissions are temporarily reserved for Contributor Tier 2+
            to review or replace stale attempts with higher-quality working.
          </p>
        </div>
      );
    }

    if (isPoolLocked) {
      return (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center shadow-xs">
          <Info className="size-8 text-amber-600 mx-auto mb-2" />
          <h4 className="font-semibold text-ink text-sm">Solution Pool Locked (High Quality)</h4>
          <p className="mt-1 text-xs text-ink-muted max-w-md mx-auto">
            All 7 active solutions currently have positive peer ratings (S &gt; 0) or author endorsements.
            The pool is locked until community consensus shifts.
          </p>
        </div>
      );
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError("");
    setServerFieldErrors({});

    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      // Upload solution diagram attachments if any
      const uploadedAttachments: Array<{ file_key: string; file_name: string }> = [];
      if (data.attachments && data.attachments.length > 0) {
        for (const file of Array.from(data.attachments as File[])) {
          const presigned = await generateProblemUploadUrl(
            file.name,
            file.type,
            "solution_attachment",
            token
          );

          const putRes = await fetch(presigned.upload_url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!putRes.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          uploadedAttachments.push({
            file_key: presigned.file_key,
            file_name: file.name,
          });
        }
      }

      const payload = {
        body: data.body.trim(),
        video_url: data.video_url?.trim() || null,
        attachments: uploadedAttachments,
      };

      await apiFetch<Solution>(`/problems/${problemId}/solutions/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["solutions", problemId] });
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] });
      toast.success("Solution posted successfully!");
      reset({ body: "", video_url: "" });
      setValue("attachments", undefined);
    } catch (err: any) {
      if (err.code === "POOL_CAPACITY_EXCEEDED") {
        setServerError("Active solution pool is full (7/7). Contributor Tier 2+ required to evict stale attempts.");
        toast.error("Pool capacity exceeded.");
      } else if (err.code === "POOL_LOCKED_HIGH_QUALITY") {
        setServerError("All 7 active solutions currently have positive peer ratings. The pool is locked.");
        toast.error("Solution pool is locked.");
      } else if (err.code === "THREAD_CLOSED") {
        setServerError("This discussion thread has been closed.");
        toast.error("Thread is closed.");
      } else {
        const { serverMessage, fieldErrors, failedFieldLabels } = extractApiFieldErrors(
          err,
          {
            body: "body",
            video_url: "video_url",
            file: "attachments",
            attachments: "attachments",
          },
          "Failed to post solution."
        );

        setServerError(serverMessage);
        setServerFieldErrors(fieldErrors);
        applyFieldErrorsToForm(fieldErrors, setError);

        const errorLabel = failedFieldLabels.length > 0
          ? `Please fix errors in ${failedFieldLabels.join(", ")}`
          : serverMessage;
        toast.error(`Validation failed: ${errorLabel}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-ink">Submit a Worked Solution</h3>
        {activePoolCount >= 7 && canEvict && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <Sparkles className="size-3" /> Tier 2+ Eviction Enabled
          </span>
        )}
      </div>

      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />

      {activePoolCount >= 7 && canEvict && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 text-xs text-ink flex items-start gap-2">
          <Info className="size-4 shrink-0 text-brand mt-0.5" />
          <span>
            The active pool is at capacity (7/7). Submitting your solution will automatically archive the lowest-scoring unendorsed attempt (S &le; 0).
          </span>
        </div>
      )}

      <Field label="Your Worked Steps & Reasoning">
        <textarea
          {...register("body")}
          className={`${inputClass} min-h-36 resize-none ${errors.body ? errorClass : ""}`}
          placeholder="Explain your step-by-step mathematical working clearly..."
        />
        {errors.body && <p className="mt-1 text-xs text-danger font-normal">{errors.body.message}</p>}
      </Field>

      <Field label="Video Walkthrough URL (Optional)">
        <div className="relative">
          <input
            {...register("video_url")}
            placeholder="e.g. https://www.youtube.com/watch?v=..."
            className={`${inputClass} pl-8 ${errors.video_url ? errorClass : ""}`}
          />
          <Video className="size-4 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
        {errors.video_url && <p className="mt-1 text-xs text-danger font-normal">{errors.video_url.message}</p>}
      </Field>

      <Field label="Diagrams / Working Photos (Optional · Max 3 · 5MB each)">
        <FileDropzone
          onFilesSelected={(files) => {
            setValue("attachments", files, { shouldValidate: true });
          }}
          maxFiles={3}
          maxSizeMB={5}
          acceptedTypes={ACCEPTED_FILE_TYPES}
          error={errors.attachments?.message as string}
        />
        {(errors as any).attachments && (
          <p className="mt-1 text-xs text-danger font-normal">{(errors as any).attachments.message}</p>
        )}
      </Field>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Submitting Solution..." : "Post Solution"}
        </Button>
      </div>
    </form>
  );
}
