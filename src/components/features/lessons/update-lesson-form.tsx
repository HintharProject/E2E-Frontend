"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
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
  getFileExtension,
  isAllowedYouTubeUrl,
  UPLOAD_SCOPE_RULES,
} from "@/lib/upload-rules";
import { extractApiFieldErrors, applyFieldErrorsToForm } from "@/lib/form-errors";
import { getMutationAuthToken } from "@/lib/client-auth";

const LESSON_RULE = UPLOAD_SCOPE_RULES.lesson_attachment;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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
  });

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
    setError,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const watchedValues = useWatch({ control });

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

  const handleDiscardDraft = () => {
    clearDraft();
    reset(initialValues);
    toast.info("Unsaved edits discarded");
  };

  const handleConfirmDeleteAttachment = async () => {
    if (!attachmentToDelete || writeLocked) return;
    const target = attachmentToDelete;
    try {
      await deleteAttachmentMutation.mutateAsync(target.id);
      setDeletedAttachmentIds((prev) =>
        prev.includes(target.id) ? prev : [...prev, target.id]
      );
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
    if (submitStage === "saving") return "Saving changes...";
    if (submitStage !== "uploading") return "Save Changes";
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

  return (
    <>
      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit, onInvalid)(e);
        }}
        noValidate
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
                className="min-h-[44px] sm:min-h-[28px] text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Discard
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={dismissRestoredNotice}
                aria-label="Dismiss draft notice"
                className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px]"
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
          htmlFor="edit-lesson-title"
          required
          error={errors.title?.message}
        >
          <Input
            id="edit-lesson-title"
            {...register("title")}
            placeholder="Lesson title"
            disabled={isFormDisabled}
            aria-invalid={!!errors.title}
          />
        </Field>

        <Field
          label="Body (max 5000)"
          htmlFor="edit-lesson-body"
          required
          error={errors.body?.message}
        >
          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <MarkdownMathEditor
                id="edit-lesson-body"
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={5000}
                required
                disabled={isFormDisabled}
                aria-invalid={!!errors.body}
              />
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Subject"
            htmlFor="edit-lesson-subject"
            required
            error={errors.subject_id?.message}
          >
            <Select
              id="edit-lesson-subject"
              {...register("subject_id")}
              disabled={isFormDisabled}
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
            htmlFor="edit-lesson-level"
            required
            error={errors.level_id?.message}
          >
            <Select
              id="edit-lesson-level"
              {...register("level_id")}
              disabled={isFormDisabled}
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
                disabled={isFormDisabled}
                error={errors.tags?.message}
              />
            )}
          />
        </Field>

        <Field
          label="Embedded video URL (YouTube / playlist)"
          htmlFor="edit-lesson-video-url"
          description="Optional. Clear this field and save to remove the embedded video."
          error={errors.embedded_video_url?.message}
        >
          <Input
            id="edit-lesson-video-url"
            {...register("embedded_video_url")}
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={isFormDisabled}
            aria-invalid={!!errors.embedded_video_url}
          />
        </Field>

        <Field
          label="State"
          htmlFor="edit-lesson-state"
          error={errors.state?.message}
        >
          <Select
            id="edit-lesson-state"
            {...register("state")}
            disabled={isFormDisabled}
            aria-invalid={!!errors.state}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>

        <Field
          label={`Attachments (${existingAttachments.length} / ${LESSON_RULE.maxFiles} used · ${remainingSlots} ${remainingSlots === 1 ? "slot" : "slots"} remaining)`}
          asGroup
        >
          {existingAttachments.length > 0 && (
            <ul className="space-y-2">
              {existingAttachments.map((att) => {
                const ext = getFileExtension(att.file_name);
                const isImg = IMAGE_EXTENSIONS.has(ext);
                const fileHref = att.download_url || att.file_url;

                return (
                  <li
                    key={att.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
                        {isImg ? (
                          <ImageIcon className="size-4" aria-hidden="true" />
                        ) : (
                          <FileText className="size-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          href={fileHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1.5 truncate rounded text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="truncate">{att.file_name}</span>
                          <ExternalLink
                            className="size-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </a>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isFormDisabled}
                      onClick={() => setAttachmentToDelete(att)}
                      aria-label={`Delete ${att.file_name}`}
                      className="min-h-[44px] min-w-[44px] sm:min-h-[36px] shrink-0 gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span>Delete</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          {remainingSlots === 0 ? (
            <div
              role="status"
              className="mt-2 flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
            >
              <Info
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p>
                Maximum of 5 attachments reached. Remove an existing file to add
                another.
              </p>
            </div>
          ) : (
            <div className={existingAttachments.length > 0 ? "mt-2" : undefined}>
              <FileDropzone
                items={stagedItems}
                onAddFiles={addFiles}
                onRemoveItem={removeFile}
                onRetryItem={(id) =>
                  void retryItem(id, () => getMutationAuthToken(getToken))
                }
                scope="lesson_attachment"
                sizeMode="total"
                maxFiles={remainingSlots}
                existingCount={0}
                disabled={isFormDisabled}
                label="Add new lesson attachments"
                helperText={`Add up to ${remainingSlots} more ${remainingSlots === 1 ? "file" : "files"} (PDF, Word, PowerPoint, Excel, ZIP, JPG, PNG, WebP · 20 MB total for new uploads)`}
                error={uploadBatchError || undefined}
              />
            </div>
          )}
        </Field>

        {isBusy && showColdStartHint && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          >
            Still working — the server may be waking up. Your edits and
            uploaded files are preserved; please keep this tab open.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Button
            type="submit"
            disabled={isFormDisabled}
            className="min-h-[44px] sm:min-h-[40px]"
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
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
            render={<Link href={`/lessons/${lesson.id}`} />}
            className="min-h-[44px] sm:min-h-[40px]"
          >
            Cancel
          </Button>
        </div>
      </form>

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
              ? This action cannot be undone.
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
