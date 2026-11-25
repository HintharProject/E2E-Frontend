"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { MarkdownMathEditor } from "@/components/ui/markdown-math-editor";
import { Subject, Level, Tag } from "@/types";
import { useCreateLesson, type UploadedLessonAttachment } from "@/hooks/use-lessons";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { isAllowedYouTubeUrl, UPLOAD_SCOPE_RULES } from "@/lib/upload-rules";
import { extractApiFieldErrors, applyFieldErrorsToForm } from "@/lib/form-errors";
import { getMutationAuthToken } from "@/lib/client-auth";

const LESSON_RULE = UPLOAD_SCOPE_RULES.lesson_attachment;

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
  body: z.string().min(1, "Body is required").max(5000, "Max 5000 characters"),
  subject_id: z.string().min(1, "Subject is required"),
  level_id: z.string().min(1, "Level is required"),
  tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
  embedded_video_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => isAllowedYouTubeUrl(val ?? ""),
      "Only YouTube video or playlist URLs are supported (youtube.com, youtu.be, youtube-nocookie.com)."
    ),
  state: z.enum(["DRAFT", "PUBLISHED"]),
});

type FormValues = z.infer<typeof formSchema>;

type LessonDraft = FormValues & Record<string, unknown>;

const EMPTY_DEFAULTS: FormValues = {
  title: "",
  body: "",
  subject_id: "",
  level_id: "",
  tags: [],
  embedded_video_url: "",
  state: "DRAFT",
};

export function CreateLessonForm({
  subjects,
  levels,
}: {
  subjects: Subject[];
  levels: Level[];
  tags?: Tag[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const createLessonMutation = useCreateLesson();

  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [submitStage, setSubmitStage] = useState<"idle" | "uploading" | "saving">(
    "idle"
  );
  const [showColdStartHint, setShowColdStartHint] = useState(false);

  const errorBannerRef = useRef<HTMLDivElement>(null);
  const appliedDraftRef = useRef(false);
  const isNavigatingAfterSuccessRef = useRef(false);

  const {
    items: stagedItems,
    batchError: uploadBatchError,
    setBatchError: setUploadBatchError,
    isUploading,
    isOptimizing,
    addFiles,
    removeFile,
    cancelUpload,
    uploadAll,
    retryItem,
    reset: resetUploads,
  } = useStagedUploads({ scope: "lesson_attachment" });

  const isDraftEmpty = useCallback((draft: Partial<LessonDraft>) => {
    return (
      !draft.title?.trim() &&
      !draft.body?.trim() &&
      !draft.subject_id?.trim() &&
      !draft.level_id?.trim() &&
      (!draft.tags || draft.tags.length === 0) &&
      !draft.embedded_video_url?.trim()
    );
  }, []);

  const {
    restoredDraft,
    hasRestoredDraft,
    saveDraft,
    clearDraft,
    dismissRestoredNotice,
  } = useDraftPersistence<LessonDraft>({
    storageKey: "draft:lesson:new",
    isEmpty: isDraftEmpty,
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const watchedValues = useWatch({ control });

  const isBusy = submitStage !== "idle" || isUploading || isOptimizing;

  const focusErrorBanner = useCallback(() => {
    requestAnimationFrame(() => {
      errorBannerRef.current?.focus();
    });
  }, []);

  // Apply restored draft once when loaded from sessionStorage
  useEffect(() => {
    if (!restoredDraft || appliedDraftRef.current) return;
    appliedDraftRef.current = true;
    reset({
      title: typeof restoredDraft.title === "string" ? restoredDraft.title : "",
      body: typeof restoredDraft.body === "string" ? restoredDraft.body : "",
      subject_id:
        typeof restoredDraft.subject_id === "string"
          ? restoredDraft.subject_id
          : "",
      level_id:
        typeof restoredDraft.level_id === "string"
          ? restoredDraft.level_id
          : "",
      tags: Array.isArray(restoredDraft.tags) ? restoredDraft.tags : [],
      embedded_video_url:
        typeof restoredDraft.embedded_video_url === "string"
          ? restoredDraft.embedded_video_url
          : "",
      state:
        restoredDraft.state === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    });
  }, [restoredDraft, reset]);

  // Pre-fill subject and level from URL query parameters when not already set by a restored draft
  useEffect(() => {
    const rawSubject =
      searchParams.get("subject") || searchParams.get("subject_id");
    const rawLevel = searchParams.get("level") || searchParams.get("level_id");
    if (rawSubject && subjects.length > 0 && !restoredDraft?.subject_id) {
      const match = subjects.find(
        (s) =>
          s.id === rawSubject ||
          s.code?.toLowerCase() === rawSubject.toLowerCase()
      );
      if (match) {
        setValue("subject_id", match.id, { shouldValidate: true });
      }
    }
    if (rawLevel && levels.length > 0 && !restoredDraft?.level_id) {
      const match = levels.find(
        (l) =>
          l.id === rawLevel ||
          l.code?.toLowerCase() === rawLevel.toLowerCase()
      );
      if (match) {
        setValue("level_id", match.id, { shouldValidate: true });
      }
    }
  }, [searchParams, subjects, levels, setValue, restoredDraft]);

  // Persist serializable draft fields on user edits
  useEffect(() => {
    if (!isDirty || isNavigatingAfterSuccessRef.current) return;
    saveDraft({
      title: watchedValues.title ?? "",
      body: watchedValues.body ?? "",
      subject_id: watchedValues.subject_id ?? "",
      level_id: watchedValues.level_id ?? "",
      tags: (watchedValues.tags ?? []).filter(
        (t): t is string => typeof t === "string"
      ),
      embedded_video_url: watchedValues.embedded_video_url ?? "",
      state: watchedValues.state === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    });
  }, [isDirty, watchedValues, saveDraft]);

  // Cold-start reassurance timer after 6 seconds of active submission
  useEffect(() => {
    if (submitStage === "idle") return;
    const timer = setTimeout(() => setShowColdStartHint(true), 6000);
    return () => clearTimeout(timer);
  }, [submitStage]);

  // Warn before unloading tab while dirty or actively uploading
  useEffect(() => {
    const hasUnsaved = isDirty || stagedItems.length > 0 || isUploading;
    if (!hasUnsaved) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingAfterSuccessRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, stagedItems.length, isUploading]);

  const handleDiscardDraft = () => {
    clearDraft();
    reset(EMPTY_DEFAULTS);
    toast.info("Unsaved draft discarded");
  };

  const uploadStatusLabel = useMemo(() => {
    if (submitStage === "saving") return "Saving lesson...";
    if (submitStage !== "uploading") return "Save Lesson";
    const total = stagedItems.length;
    if (total === 0) return "Uploading materials...";
    const uploadedCount = stagedItems.filter(
      (i) => i.status === "uploaded"
    ).length;
    const activeIndex = Math.min(total, uploadedCount + 1);
    const activeItem = stagedItems.find((i) => i.status === "uploading");
    const pct = activeItem
      ? activeItem.progress
      : Math.round((uploadedCount / total) * 100);
    return `Uploading ${activeIndex} of ${total} (${pct}%)...`;
  }, [submitStage, stagedItems]);

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setServerFieldErrors({});
    setUploadBatchError("");
    setShowColdStartHint(false);

    let uploadedAttachments: UploadedLessonAttachment[] = [];

    try {
      if (stagedItems.length > 0) {
        setSubmitStage("uploading");
        const uploaded = await uploadAll(() => getMutationAuthToken(getToken));
        uploadedAttachments = uploaded.map((item) => ({
          file_key: item.file_key,
          file_name: item.file_name,
        }));
      }

      setSubmitStage("saving");
      const trimmedVideo = data.embedded_video_url?.trim() || "";
      const created = await createLessonMutation.mutateAsync({
        title: data.title,
        body: data.body,
        subject: data.subject_id,
        level: data.level_id,
        state: data.state,
        embedded_video_url: trimmedVideo || null,
        tags: data.tags,
        uploaded_attachments: uploadedAttachments,
      });

      isNavigatingAfterSuccessRef.current = true;
      clearDraft();
      resetUploads();
      toast.success("Lesson created successfully!");
      router.push(`/lessons/${created.id}`);
    } catch (err: unknown) {
      const extracted = extractApiFieldErrors(
        err,
        {
          subject: "subject_id",
          level: "level_id",
          tags: "tags",
          embedded_video_url: "embedded_video_url",
          uploaded_attachments: "attachments",
          attachments: "attachments",
          file: "attachments",
        },
        "Could not save lesson. Please review the highlighted details and retry."
      );
      setServerError(extracted.serverMessage);
      setServerFieldErrors(extracted.fieldErrors);
      applyFieldErrorsToForm(extracted.fieldErrors, setError);
      focusErrorBanner();
    } finally {
      setSubmitStage("idle");
      setShowColdStartHint(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-card"
    >
      {hasRestoredDraft && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <RotateCcw className="size-3.5 text-primary" aria-hidden="true" />
            Restored unsaved draft
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleDiscardDraft}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={dismissRestoredNotice}
              aria-label="Dismiss draft notice"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <FormErrorBanner
        ref={errorBannerRef}
        serverMessage={serverError}
        fieldErrors={serverFieldErrors}
      />

      <Field
        label="Title (max 100)"
        htmlFor="lesson-title"
        required
        error={errors.title?.message}
      >
        <Input
          id="lesson-title"
          {...register("title")}
          placeholder="Lesson title"
          disabled={isBusy}
          aria-invalid={!!errors.title}
        />
      </Field>

      <Field
        label="Body (max 5000)"
        htmlFor="lesson-body"
        required
        error={errors.body?.message}
      >
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <MarkdownMathEditor
              id="lesson-body"
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={5000}
              required
              disabled={isBusy}
              aria-invalid={!!errors.body}
            />
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Subject"
          htmlFor="lesson-subject"
          required
          error={errors.subject_id?.message}
        >
          <Select
            id="lesson-subject"
            {...register("subject_id")}
            disabled={isBusy}
            aria-invalid={!!errors.subject_id}
          >
            <option value="">Select…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Level"
          htmlFor="lesson-level"
          required
          error={errors.level_id?.message}
        >
          <Select
            id="lesson-level"
            {...register("level_id")}
            disabled={isBusy}
            aria-invalid={!!errors.level_id}
          >
            <option value="">Select…</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Tags" asGroup error={errors.tags?.message}>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput
              value={field.value || []}
              onChange={field.onChange}
              maxTags={3}
              disabled={isBusy}
              error={errors.tags?.message}
            />
          )}
        />
      </Field>

      <Field
        label="Embedded video URL (YouTube / playlist)"
        htmlFor="lesson-video-url"
        description="Optional. Only YouTube links (youtube.com, youtu.be, youtube-nocookie.com) are supported."
        error={errors.embedded_video_url?.message}
      >
        <Input
          id="lesson-video-url"
          type="url"
          {...register("embedded_video_url")}
          placeholder="https://www.youtube.com/watch?v=…"
          disabled={isBusy}
          aria-invalid={!!errors.embedded_video_url}
        />
      </Field>

      <Field
        label={`Resources (max ${LESSON_RULE.maxFiles} · ${LESSON_RULE.maxSizeMB} MB total)`}
        asGroup
      >
        <FileDropzone
          items={stagedItems}
          onAddFiles={addFiles}
          onRemoveItem={removeFile}
          onRetryItem={(id) =>
            void retryItem(id, () => getMutationAuthToken(getToken))
          }
          scope="lesson_attachment"
          sizeMode="total"
          disabled={isBusy}
          label="Upload lesson materials"
          helperText="PDF, Word, PowerPoint, Excel, ZIP, or images (JPG, PNG, WebP) · Max 5 files · 20 MB total"
          error={uploadBatchError || undefined}
        />
      </Field>

      <Field
        label="Initial state"
        htmlFor="lesson-state"
        error={errors.state?.message}
      >
        <Select
          id="lesson-state"
          {...register("state")}
          disabled={isBusy}
          aria-invalid={!!errors.state}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </Select>
      </Field>

      {isBusy && showColdStartHint && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        >
          Still working — the server may be waking up. Your lesson text and uploaded files are preserved; please keep this tab open.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        <Button type="submit" disabled={isBusy} className="min-h-[44px] sm:min-h-[40px]">
          {isBusy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-4" aria-hidden="true" />
          )}
          <span>{uploadStatusLabel}</span>
        </Button>

        {isUploading && (
          <Button
            type="button"
            variant="outline"
            onClick={() => cancelUpload()}
            className="min-h-[44px] sm:min-h-[40px]"
          >
            Cancel upload
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          disabled={isBusy}
          nativeButton={false}
          render={<Link href="/lessons/manage" />}
          className="min-h-[44px] sm:min-h-[40px]"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
