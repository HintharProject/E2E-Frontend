"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Video } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { Input } from "@/components/ui/input";
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
import {
  MediaDock,
  type ExistingDockAttachment,
} from "@/components/features/editor/media-dock";
import { useEditorMediaItems } from "@/components/features/editor/use-editor-media-items";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Subject, Level, Tag, Lesson, LessonAttachment } from "@/types";
import {
  useUpdateLesson,
  useDeleteLessonAttachment,
  type UploadedLessonAttachment,
} from "@/hooks/use-lessons";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import {
  appendInlineImageToBody,
  isImageFileName,
  removeInlineImageFromBody,
} from "@/lib/inline-media";
import {
  isAllowedYouTubeUrl,
  UPLOAD_SCOPE_RULES,
} from "@/lib/upload-rules";
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
  state: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type FormValues = z.infer<typeof formSchema>;
type LessonEditDraft = FormValues & Record<string, unknown>;

export function UpdateLessonForm({
  lesson,
  subjects,
  levels,
  writeLocked,
}: {
  lesson: Lesson;
  subjects: Subject[];
  levels: Level[];
  tags?: Tag[];
  writeLocked: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const updateLessonMutation = useUpdateLesson(lesson.id);
  const deleteAttachmentMutation = useDeleteLessonAttachment(lesson.id);

  const [mode, setMode] = useState<"write" | "preview">("write");
  const [showVideoWell, setShowVideoWell] = useState(
    Boolean(lesson.embedded_video_url)
  );
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>(
    []
  );
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<LessonAttachment | null>(null);
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

  const existingAttachments = useMemo(
    () =>
      (lesson.attachments ?? []).filter(
        (att) => !deletedAttachmentIds.includes(att.id)
      ),
    [lesson.attachments, deletedAttachmentIds]
  );

  const existingFileNames = useMemo(
    () => existingAttachments.map((a) => a.file_name),
    [existingAttachments]
  );

  const remainingSlots = Math.max(
    0,
    LESSON_RULE.maxFiles - existingAttachments.length
  );

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
    existingCount: existingAttachments.length,
    existingFileNames,
    optimizeImages: true,
  });

  const mediaItems = useEditorMediaItems(stagedItems, existingAttachments);

  const initialValues = useMemo<FormValues>(() => {
    const initialTags =
      (lesson.tags_data || []).map((t) => t.name).length > 0
        ? (lesson.tags_data || []).map((t) => t.name)
        : lesson.tags || [];
    const initialState: FormValues["state"] =
      lesson.state === "PUBLISHED" || lesson.state === "ARCHIVED"
        ? lesson.state
        : "DRAFT";

    return {
      title: lesson.title,
      body: lesson.body,
      subject_id: lesson.subject ?? "",
      level_id: lesson.level ?? "",
      tags: initialTags,
      embedded_video_url: lesson.embedded_video_url ?? "",
      state: initialState,
    };
  }, [lesson]);

  const isDraftUnchanged = useCallback(
    (draft: Partial<LessonEditDraft>) => {
      const draftTags = Array.isArray(draft.tags) ? draft.tags : [];
      return (
        (draft.title ?? "") === initialValues.title &&
        (draft.body ?? "") === initialValues.body &&
        (draft.subject_id ?? "") === initialValues.subject_id &&
        (draft.level_id ?? "") === initialValues.level_id &&
        (draft.embedded_video_url ?? "") ===
          (initialValues.embedded_video_url ?? "") &&
        (draft.state ?? initialValues.state) === initialValues.state &&
        JSON.stringify(draftTags) === JSON.stringify(initialValues.tags)
      );
    },
    [initialValues]
  );

  const {
    restoredDraft,
    hasRestoredDraft,
    saveDraft,
    clearDraft,
    dismissRestoredNotice,
  } = useDraftPersistence<LessonEditDraft>({
    storageKey: `draft:lesson:edit:${lesson.id}`,
    enabled: !writeLocked,
    isEmpty: isDraftUnchanged,
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
    defaultValues: initialValues,
  });

  const watchedValues = useWatch({ control });
  const watchedBody = watchedValues.body ?? "";
  const watchedVideoUrl = watchedValues.embedded_video_url ?? "";

  const isBusy =
    submitStage !== "idle" ||
    isUploading ||
    isOptimizing ||
    deleteAttachmentMutation.isPending;
  const isFormDisabled = writeLocked || isBusy;

  const focusErrorBanner = useCallback(() => {
    requestAnimationFrame(() => {
      errorBannerRef.current?.focus();
    });
  }, []);

  // Apply restored draft once on mount if present
  useEffect(() => {
    if (!restoredDraft || appliedDraftRef.current) return;
    appliedDraftRef.current = true;
    reset({
      title:
        typeof restoredDraft.title === "string"
          ? restoredDraft.title
          : initialValues.title,
      body:
        typeof restoredDraft.body === "string"
          ? restoredDraft.body
          : initialValues.body,
      subject_id:
        typeof restoredDraft.subject_id === "string"
          ? restoredDraft.subject_id
          : initialValues.subject_id,
      level_id:
        typeof restoredDraft.level_id === "string"
          ? restoredDraft.level_id
          : initialValues.level_id,
      tags: Array.isArray(restoredDraft.tags)
        ? restoredDraft.tags
        : initialValues.tags,
      embedded_video_url:
        typeof restoredDraft.embedded_video_url === "string"
          ? restoredDraft.embedded_video_url
          : (initialValues.embedded_video_url ?? ""),
      state:
        restoredDraft.state === "DRAFT" ||
        restoredDraft.state === "PUBLISHED" ||
        restoredDraft.state === "ARCHIVED"
          ? restoredDraft.state
          : initialValues.state,
    });
  }, [restoredDraft, reset, initialValues]);

  // Persist serializable edits to sessionStorage
  useEffect(() => {
    if (writeLocked || !isDirty || isNavigatingAfterSuccessRef.current) return;
    saveDraft({
      title: watchedValues.title ?? "",
      body: watchedValues.body ?? "",
      subject_id: watchedValues.subject_id ?? "",
      level_id: watchedValues.level_id ?? "",
      tags: (watchedValues.tags ?? []).filter(
        (t): t is string => typeof t === "string"
      ),
      embedded_video_url: watchedValues.embedded_video_url ?? "",
      state:
        watchedValues.state === "PUBLISHED" ||
        watchedValues.state === "ARCHIVED"
          ? watchedValues.state
          : "DRAFT",
    });
  }, [writeLocked, isDirty, watchedValues, saveDraft]);

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
    reset(initialValues);
    resetUploads();
    toast.info("Unsaved edits discarded");
  };

  const handleRequestDeleteExisting = useCallback(
    (dockAtt: ExistingDockAttachment) => {
      const full = existingAttachments.find((a) => a.id === dockAtt.id);
      if (full) {
        setAttachmentToDelete(full);
      }
    },
    [existingAttachments]
  );

  const handleConfirmDeleteAttachment = async () => {
    if (!attachmentToDelete || writeLocked) return;
    const target = attachmentToDelete;
    try {
      await deleteAttachmentMutation.mutateAsync(target.id);
      setDeletedAttachmentIds((prev) =>
        prev.includes(target.id) ? prev : [...prev, target.id]
      );

      // Sync inline blocks if the deleted attachment was an inline image
      if (isImageFileName(target.file_name)) {
        const currentBody = getValues("body") || "";
        const nextBody = removeInlineImageFromBody(currentBody, target.file_name);
        if (nextBody !== currentBody) {
          setValue("body", nextBody, {
            shouldDirty: true,
            shouldValidate: true,
          });
          toast.info(`Removed inline image block for ${target.file_name}`);
        }
      }

      setAttachmentToDelete(null);
      router.refresh();
      toast.success("Attachment deleted");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not delete attachment.";
      toast.error(`Failed to delete attachment: ${message}`);
    }
  };

  const uploadStatusLabel = useMemo(() => {
    if (submitStage === "saving") return "Saving…";
    if (submitStage !== "uploading") return "Save Changes";
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
    if (writeLocked) return;

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
      await updateLessonMutation.mutateAsync({
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
      toast.success("Lesson updated successfully!");
      router.refresh();
      router.push(`/lessons/${lesson.id}`);
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
        "Could not save changes. Please review the highlighted details and retry."
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

  return (
    <>
      <ArchivalComposerShell
        backHref={`/lessons/${lesson.id}`}
        backLabel="Lesson"
        cancelHref={`/lessons/${lesson.id}`}
        mode={mode}
        onModeChange={setMode}
        charCount={watchedBody.length}
        maxChars={5000}
        submitLabel={uploadStatusLabel}
        isSubmitting={isBusy}
        submitDisabled={writeLocked}
        isUploading={isUploading}
        onCancelUpload={() => cancelUpload()}
        onSubmit={(e) => {
          void handleSubmit(onSubmit, onInvalid)(e);
        }}
        autosaveLabel={isDirty ? "Unsaved edits saved locally" : undefined}
        draftBanner={{
          visible: hasRestoredDraft,
          message: "Restored unsaved draft from this browser session.",
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
              Still working — the server may be waking up. Your edits and uploaded files are preserved; please keep this tab open.
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
            id="edit-lesson-subject"
            label="Subject"
            required
            invalid={!!errors.subject_id}
            disabled={isFormDisabled}
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
            id="edit-lesson-level"
            label="Level"
            required
            invalid={!!errors.level_id}
            disabled={isFormDisabled}
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
            id="edit-lesson-state"
            label="State"
            invalid={!!errors.state}
            disabled={isFormDisabled}
            {...register("state")}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
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
              htmlFor="edit-lesson-video-url"
              className="text-xs font-medium text-foreground"
            >
              Embedded video URL (YouTube / playlist)
            </label>
            <Input
              id="edit-lesson-video-url"
              {...register("embedded_video_url")}
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              disabled={isFormDisabled}
              aria-invalid={!!errors.embedded_video_url}
              className="text-base sm:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Optional. Clear this field and save to remove the embedded video.
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
              disabled={isFormDisabled}
              error={errors.tags?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <ArchivalTitleInput
              id="edit-lesson-title"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={100}
              disabled={isFormDisabled}
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
                id="edit-lesson-body"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                mode={mode}
                attachments={mediaItems}
                canUploadMore={remainingSlots - stagedItems.length > 0}
                acceptString=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onUploadImages={handleUploadAndReturnImageNames}
                maxLength={5000}
                disabled={isFormDisabled}
                aria-invalid={!!errors.body}
                placeholder="Write your lesson explanation with Markdown and LaTeX. Insert diagram breaks between paragraphs..."
                emptyPreviewText="Nothing to preview yet."
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
          existingAttachments={existingAttachments}
          onAddFiles={addFiles}
          onRemoveStaged={removeFile}
          onRetryStaged={(id) =>
            void retryItem(id, () => getMutationAuthToken(getToken))
          }
          onDeleteExisting={handleRequestDeleteExisting}
          onInsertInlineImage={handleInsertFromDock}
          helperText={
            remainingSlots === 0
              ? "Maximum of 5 attachments reached. Delete an existing file to add another."
              : `Add up to ${remainingSlots} more ${remainingSlots === 1 ? "file" : "files"} (JPG, PNG, WebP, PDF, Word, PowerPoint, Excel, ZIP · Max ${LESSON_RULE.maxSizeMB} MB per file).`
          }
          error={uploadBatchError || undefined}
          disabled={isFormDisabled}
        />
      </ArchivalComposerShell>

      <Dialog
        open={Boolean(attachmentToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteAttachmentMutation.isPending) {
            setAttachmentToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete attachment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {attachmentToDelete?.file_name}
              </span>
              ? Any inline image block referencing this file will also be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleteAttachmentMutation.isPending}
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteAttachmentMutation.isPending}
              onClick={handleConfirmDeleteAttachment}
            >
              {deleteAttachmentMutation.isPending ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Attachment</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
