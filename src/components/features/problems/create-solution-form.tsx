"use client";

import { useState, useEffect, useRef, useId, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import {
  ArchivalComposerShell,
} from "@/components/features/editor/archival-composer-shell";
import {
  MetadataPillBar,
  MetadataTogglePill,
} from "@/components/features/editor/metadata-pill-bar";
import { BlockDocumentEditor } from "@/components/features/editor/block-document-editor";
import { MediaDock } from "@/components/features/editor/media-dock";
import { useEditorMediaItems } from "@/components/features/editor/use-editor-media-items";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Solution } from "@/types";
import { applyFieldErrorsToForm, extractApiFieldErrors } from "@/lib/form-errors";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { appendInlineImageToBody } from "@/lib/inline-media";
import { isAllowedYouTubeUrl, UPLOAD_SCOPE_RULES } from "@/lib/upload-rules";
import { Video } from "lucide-react";

const SOLUTION_RULE = UPLOAD_SCOPE_RULES.solution_attachment;

const formSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, "Solution description must be at least 10 characters")
    .max(8000, "Max 8000 characters"),
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

  const [mode, setMode] = useState<"write" | "preview">("write");
  const [showVideoWell, setShowVideoWell] = useState(false);
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

  const mediaItems = useEditorMediaItems(items);

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      body: "",
      video_url: "",
    },
  });

  const watchedBody = useWatch({ control, name: "body" }) || "";
  const watchedVideoUrl = useWatch({ control, name: "video_url" }) || "";

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

  const handleUploadAndReturnNames = useCallback(
    async (files: File[]): Promise<Array<{ fileName: string }>> => {
      const res = await addFiles(files);
      return res.added.map((item) => ({ fileName: item.file.name }));
    },
    [addFiles]
  );

  const handleInsertFromDock = useCallback(
    (fileName: string) => {
      const current = getValues("body") || "";
      setValue("body", appendInlineImageToBody(current, fileName), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [getValues, setValue]
  );

  if (isLocked) {
    return (
      <div className="my-4 rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
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
      const uploaded = items.length > 0 ? await uploadAll(getToken) : [];

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
        ? `Uploading ${uploadingIndex + 1} of ${items.length} (${activeUploadProgress}%)…`
        : "Uploading diagrams…"
      : submitStage === "saving"
        ? "Posting solution…"
        : "Post Solution";

  const videoOpen =
    showVideoWell ||
    Boolean(watchedVideoUrl.trim()) ||
    Boolean(errors.video_url?.message);

  return (
    <ArchivalComposerShell
      stickyVariant="dialog"
      mode={mode}
      onModeChange={setMode}
      charCount={watchedBody.length}
      maxChars={8000}
      submitLabel={submitLabel}
      isSubmitting={isSubmitting}
      submitDisabled={isOptimizing}
      isUploading={isUploading}
      onCancelUpload={() => cancelUpload()}
      onCancel={onCancel ? handleCancel : undefined}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      errorBanner={
        <FormErrorBanner
          ref={errorBannerRef}
          serverMessage={serverError}
          fieldErrors={serverFieldErrors}
        />
      }
      coldStartNotice={
        isSubmitting && elapsedSeconds >= 6 ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground"
          >
            Server is waking up or finishing transfer — please keep this tab open.
          </p>
        ) : undefined
      }
    >
      <MetadataPillBar errors={[errors.video_url?.message]}>
        <MetadataTogglePill
          active={videoOpen}
          hasValue={Boolean(watchedVideoUrl.trim())}
          onClick={() => setShowVideoWell((prev) => !prev)}
          icon={<Video className="size-3.5 text-primary" aria-hidden="true" />}
        >
          {watchedVideoUrl.trim() ? "YouTube Walkthrough Added" : "Add YouTube Walkthrough"}
        </MetadataTogglePill>
      </MetadataPillBar>

      {videoOpen && (
        <div className="rounded-xl border border-border bg-card/70 p-3.5 space-y-1.5">
          <label
            htmlFor={videoFieldId}
            className="text-xs font-medium text-foreground"
          >
            YouTube Video Walkthrough URL (Optional)
          </label>
          <Input
            id={videoFieldId}
            {...register("video_url")}
            disabled={isSubmitting}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-invalid={!!errors.video_url}
            className="text-base sm:text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Supports youtube.com, youtu.be, or youtube-nocookie.com links.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <BlockDocumentEditor
              id={bodyFieldId}
              value={field.value || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              mode={mode}
              attachments={mediaItems}
              canUploadMore={items.length < SOLUTION_RULE.maxFiles}
              acceptString={SOLUTION_RULE.acceptString}
              onUploadImages={handleUploadAndReturnNames}
              maxLength={8000}
              disabled={isSubmitting}
              aria-invalid={!!errors.body}
              placeholder="Explain your step-by-step mathematical working clearly. Insert diagram breaks between steps..."
              emptyPreviewText="Nothing to preview yet. Write your solution steps or insert a diagram."
            />
          )}
        />
        {errors.body?.message && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.body.message}
          </p>
        )}
      </div>

      <MediaDock
        scope="solution_attachment"
        title="Worked Diagrams"
        body={watchedBody}
        stagedItems={items}
        onAddFiles={addFiles}
        onRemoveStaged={removeFile}
        onRetryStaged={(id) => void retryItem(id, getToken)}
        onInsertInlineImage={handleInsertFromDock}
        helperText="Up to 5 images (JPG, PNG, WebP). Photos up to 25 MB are automatically optimized to WebP (<= 5 MB final)."
        error={
          batchError || (errors.attachments?.message as string | undefined)
        }
        disabled={isSubmitting}
      />
    </ArchivalComposerShell>
  );
}
