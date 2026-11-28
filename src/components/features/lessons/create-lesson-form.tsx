"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Video } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import {
  ArchivalComposerShell,
  ArchivalTitleInput,
} from "@/components/features/editor/archival-composer-shell";
import {
  MetadataPillBar,
  MetadataSelectPill,
  MetadataTogglePill,
} from "@/components/features/editor/metadata-pill-bar";
import { BlockDocumentEditor } from "@/components/features/editor/block-document-editor";
import { MediaDock } from "@/components/features/editor/media-dock";
import { useEditorMediaItems } from "@/components/features/editor/use-editor-media-items";
import { Subject, Level, Tag } from "@/types";
import { useCreateLesson, type UploadedLessonAttachment } from "@/hooks/use-lessons";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import {
  appendInlineImageToBody,
  extractInlineImageRefs,
} from "@/lib/inline-media";
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

  const [mode, setMode] = useState<"write" | "preview">("write");
  const [showVideoWell, setShowVideoWell] = useState(false);
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
  } = useStagedUploads({
    scope: "lesson_attachment",
    optimizeImages: true,
  });

  const mediaItems = useEditorMediaItems(stagedItems);

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
    getValues,
    setError,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const watchedValues = useWatch({ control });
  const watchedBody = watchedValues.body ?? "";
  const watchedVideoUrl = watchedValues.embedded_video_url ?? "";

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

  const handleUploadAndReturnImageNames = useCallback(
    async (files: File[]): Promise<Array<{ fileName: string }>> => {
      const res = await addFiles(files);
      return res.added
        .filter((i) => i.file.type.startsWith("image/"))
        .map((i) => ({ fileName: i.file.name }));
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

  const handleDiscardDraft = () => {
    clearDraft();
    reset(EMPTY_DEFAULTS);
    resetUploads();
    toast.info("Unsaved draft discarded");
  };

  const uploadStatusLabel = useMemo(() => {
    if (submitStage === "saving") return "Saving lesson…";
    if (submitStage !== "uploading") return "Save Lesson";
    const total = stagedItems.length;
    if (total === 0) return "Uploading…";
    const uploadedCount = stagedItems.filter(
      (i) => i.status === "uploaded"
    ).length;
    const activeIndex = Math.min(total, uploadedCount + 1);
    const activeItem = stagedItems.find((i) => i.status === "uploading");
    const pct = activeItem
      ? activeItem.progress
      : Math.round((uploadedCount / total) * 100);
    return `Uploading ${activeIndex}/${total} (${pct}%)…`;
  }, [submitStage, stagedItems]);

  const onInvalid = () => {
    setServerError("Please review the highlighted fields before submitting.");
    setServerFieldErrors({});
    focusErrorBanner();
  };

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setServerFieldErrors({});
    setUploadBatchError("");
    setShowColdStartHint(false);

    let uploadedAttachments: UploadedLessonAttachment[] = [];
    let succeeded = false;

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

      succeeded = true;
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
      if (!succeeded) {
        setSubmitStage("idle");
        setShowColdStartHint(false);
      }
    }
  };

  const videoOpen =
    showVideoWell ||
    Boolean(watchedVideoUrl.trim()) ||
    Boolean(errors.embedded_video_url?.message);
  const hasRestoredInlineTokens =
    hasRestoredDraft &&
    extractInlineImageRefs(watchedBody).length > 0 &&
    stagedItems.length === 0;

  return (
    <ArchivalComposerShell
      backHref="/lessons/manage"
      backLabel="Lessons"
      cancelHref="/lessons/manage"
      mode={mode}
      onModeChange={setMode}
      charCount={watchedBody.length}
      maxChars={5000}
      submitLabel={uploadStatusLabel}
      isSubmitting={isBusy}
      isUploading={isUploading}
      onCancelUpload={() => cancelUpload()}
      onSubmit={(e) => {
        void handleSubmit(onSubmit, onInvalid)(e);
      }}
      autosaveLabel={isDirty ? "Draft saved locally" : undefined}
      draftBanner={{
        visible: hasRestoredDraft,
        message: "Restored unsaved draft from this browser session.",
        missingMediaNote: hasRestoredInlineTokens
          ? "Local image files do not persist across reloads — re-attach any missing inline images below."
          : undefined,
        onDiscard: handleDiscardDraft,
        onDismiss: dismissRestoredNotice,
      }}
      errorBanner={
        <FormErrorBanner
          ref={errorBannerRef}
          serverMessage={serverError}
          fieldErrors={serverFieldErrors}
        />
      }
      coldStartNotice={
        isBusy && showColdStartHint ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground"
          >
            Still working — the server may be waking up. Your lesson text and uploaded files are preserved; please keep this tab open.
          </p>
        ) : undefined
      }
    >
      <MetadataPillBar
        errors={[
          errors.subject_id?.message,
          errors.level_id?.message,
          errors.state?.message,
          errors.embedded_video_url?.message,
          errors.tags?.message,
        ]}
      >
        <MetadataSelectPill
          id="lesson-subject"
          label="Subject"
          required
          invalid={!!errors.subject_id}
          disabled={isBusy}
          {...register("subject_id")}
        >
          <option value="">Subject *</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </MetadataSelectPill>

        <MetadataSelectPill
          id="lesson-level"
          label="Level"
          required
          invalid={!!errors.level_id}
          disabled={isBusy}
          {...register("level_id")}
        >
          <option value="">Level *</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </MetadataSelectPill>

        <MetadataSelectPill
          id="lesson-state"
          label="Initial state"
          invalid={!!errors.state}
          disabled={isBusy}
          {...register("state")}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </MetadataSelectPill>

        <MetadataTogglePill
          active={videoOpen}
          hasValue={Boolean(watchedVideoUrl.trim())}
          onClick={() => setShowVideoWell((prev) => !prev)}
          icon={<Video className="size-3.5 text-primary" aria-hidden="true" />}
        >
          {watchedVideoUrl.trim() ? "YouTube Video Added" : "Add YouTube Video"}
        </MetadataTogglePill>
      </MetadataPillBar>

      {videoOpen && (
        <div className="rounded-xl border border-border bg-card/70 p-3.5 space-y-1.5">
          <label
            htmlFor="lesson-video-url"
            className="text-xs font-medium text-foreground"
          >
            Embedded video URL (YouTube / playlist)
          </label>
          <Input
            id="lesson-video-url"
            type="url"
            {...register("embedded_video_url")}
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={isBusy}
            aria-invalid={!!errors.embedded_video_url}
            className="text-base sm:text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Only YouTube links (youtube.com, youtu.be, youtube-nocookie.com) are supported — no direct video upload.
          </p>
        </div>
      )}

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

      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <ArchivalTitleInput
            id="lesson-title"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={100}
            disabled={isBusy}
            placeholder="Lesson title..."
            error={errors.title?.message}
            aria-invalid={!!errors.title}
          />
        )}
      />

      <div className="space-y-1.5">
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <BlockDocumentEditor
              id="lesson-body"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              mode={mode}
              attachments={mediaItems}
              canUploadMore={stagedItems.length < LESSON_RULE.maxFiles}
              acceptString=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onUploadImages={handleUploadAndReturnImageNames}
              maxLength={5000}
              disabled={isBusy}
              aria-invalid={!!errors.body}
              placeholder="Write your lesson explanation with Markdown and LaTeX. Insert diagram breaks between paragraphs..."
              emptyPreviewText="Nothing to preview yet. Write your lesson content or insert a diagram."
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
        scope="lesson_attachment"
        title="Lesson Media & Downloadable Resources"
        body={watchedBody}
        stagedItems={stagedItems}
        onAddFiles={addFiles}
        onRemoveStaged={removeFile}
        onRetryStaged={(id) =>
          void retryItem(id, () => getMutationAuthToken(getToken))
        }
        onInsertInlineImage={handleInsertFromDock}
        helperText={`Images (JPG, PNG, WebP) can be placed inline or in the top gallery; PDF, Word, PowerPoint, Excel, and ZIP files appear in Downloadable Resources · Max ${LESSON_RULE.maxFiles} files, ${LESSON_RULE.maxSizeMB} MB per file.`}
        error={uploadBatchError || undefined}
        disabled={isBusy}
      />
    </ArchivalComposerShell>
  );
}
