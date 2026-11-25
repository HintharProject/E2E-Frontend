"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { MarkdownMathEditor } from "@/components/ui/markdown-math-editor";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Solution } from "@/types";
import { applyFieldErrorsToForm, extractApiFieldErrors } from "@/lib/form-errors";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { isAllowedYouTubeUrl } from "@/lib/upload-rules";
import { Loader2, Video } from "lucide-react";

const formSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, "Solution description must be at least 10 characters")
    .max(5000, "Max 5000 characters"),
  video_url: z
    .string()
    .trim()
    .refine((val) => isAllowedYouTubeUrl(val), {
      message:
        "Must be a valid YouTube URL (youtube.com, youtu.be, or youtube-nocookie.com).",
    })
    .optional()
    .or(z.literal("")),
  attachments: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface CreateSolutionFormProps {
  problemId: string;
  isLocked?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateSolutionForm({
  problemId,
  isLocked = false,
  onSuccess,
  onCancel,
}: CreateSolutionFormProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const formUid = useId();
  const bodyFieldId = `${formUid}-solution-body`;
  const videoFieldId = `${formUid}-solution-video`;

  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [errorFocusTick, setErrorFocusTick] = useState(0);

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

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      body: "",
      video_url: "",
    },
  });

  const isSubmitting = submitStage !== "idle";

  // Elapsed timer for cold-start reassurance (> 6s)
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

  // Warn before closing tab while uploading or dirty
  useEffect(() => {
    const shouldWarn = isSubmitting || isUploading || isDirty || items.length > 0;
    if (!shouldWarn) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting, isUploading, isDirty, items.length]);

  useEffect(() => {
    if (errorFocusTick > 0) {
      errorBannerRef.current?.focus();
    }
  }, [errorFocusTick]);

  if (isLocked) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        This problem thread has been locked by moderation. New solutions cannot be posted.
      </div>
    );
  }

  const handleCancel = () => {
    resetUploads();
    reset({ body: "", video_url: "" });
    setServerError("");
    setServerFieldErrors({});
    onCancel?.();
  };

  const onInvalid = () => {
    setServerError("Please review the highlighted fields before submitting.");
    setServerFieldErrors({});
    setErrorFocusTick((n) => n + 1);
  };

  const onSubmit = async (data: FormValues) => {
    if (isOptimizing) {
      setServerError("Please wait for image optimization to finish.");
      setErrorFocusTick((n) => n + 1);
      return;
    }

    setServerError("");
    setServerFieldErrors({});
    clearErrors("attachments");
    setElapsedSeconds(0);
    setSubmitStage(items.length > 0 ? "uploading" : "saving");

    try {
      const uploaded =
        items.length > 0 ? await uploadAll(getToken) : [];

      setSubmitStage("saving");
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required. Please sign in and retry.");
      }

      const payload = {
        body: data.body.trim(),
        video_url: data.video_url?.trim() || null,
        attachments: uploaded.map(({ file_key, file_name }) => ({
          file_key,
          file_name,
        })),
      };

      await apiFetch<Solution>(`/problems/${problemId}/solutions/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["solutions", problemId] });
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["paperProblems"] });
      queryClient.invalidateQueries({ queryKey: ["by-paper"] });

      toast.success("Solution posted successfully!");
      resetUploads();
      reset({ body: "", video_url: "" });
      onSuccess?.();
    } catch (err: unknown) {
      const apiErr = err as { code?: string };
      if (apiErr?.code === "THREAD_LOCKED") {
        setServerError("This problem thread has been locked by moderation.");
        toast.error("Thread is locked.");
      } else {
        const { serverMessage, fieldErrors } = extractApiFieldErrors(
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
      }
      setErrorFocusTick((n) => n + 1);
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
        ? "Posting solution..."
        : "Post Solution";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-heading text-lg font-semibold text-foreground">
        Submit a Worked Solution
      </h3>

      <FormErrorBanner
        ref={errorBannerRef}
        serverMessage={serverError}
        fieldErrors={serverFieldErrors}
      />

      <Field
        label="Your Worked Steps & Reasoning"
        htmlFor={bodyFieldId}
        required
        error={errors.body?.message}
      >
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <MarkdownMathEditor
              id={bodyFieldId}
              name={field.name}
              ref={field.ref}
              value={field.value || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={5000}
              rows={6}
              disabled={isSubmitting}
              required
              aria-invalid={!!errors.body}
              placeholder="Explain your step-by-step mathematical working clearly..."
            />
          )}
        />
      </Field>

      <Field
        label="YouTube Video Walkthrough URL (Optional)"
        htmlFor={videoFieldId}
        description="Supports youtube.com, youtu.be, or youtube-nocookie.com links."
        error={errors.video_url?.message}
      >
        <div className="relative">
          <Input
            id={videoFieldId}
            {...register("video_url")}
            disabled={isSubmitting}
            placeholder="e.g. https://www.youtube.com/watch?v=..."
            className="pl-9"
            aria-invalid={!!errors.video_url}
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
          label="Upload solution diagrams"
          helperText="Up to 3 images (JPG, PNG, WebP). High-resolution phone photos up to 25MB are automatically optimized to WebP (<= 5MB final)."
          error={
            batchError ||
            (errors.attachments?.message as string | undefined)
          }
        />
      </Field>

      {isSubmitting && elapsedSeconds >= 6 && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-muted-foreground text-right"
        >
          Server is waking up or finishing transfer — please keep this tab open.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
        {isUploading && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => cancelUpload()}
            className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Cancel Upload
          </Button>
        )}
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || isOptimizing}
          className="w-full sm:w-auto gap-2"
        >
          {isSubmitting && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          <span>{submitLabel}</span>
        </Button>
      </div>
    </form>
  );
}
