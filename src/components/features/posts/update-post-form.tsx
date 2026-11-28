"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@clerk/nextjs";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PostAttachment } from "@/components/features/posts/post-attachment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { MarkdownMathEditor } from "@/components/ui/markdown-math-editor";
import { TagInput } from "@/components/ui/tag-input";
import {
  ArchivalComposerShell,
  ArchivalTitleInput,
} from "@/components/features/editor/archival-composer-shell";
import {
  MetadataPillBar,
  MetadataSelectPill,
} from "@/components/features/editor/metadata-pill-bar";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { useRemovePostAttachment, useUpdatePost } from "@/hooks/use-posts";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { getMutationAuthToken } from "@/lib/client-auth";
import {
  applyFieldErrorsToForm,
  extractApiFieldErrors,
} from "@/lib/form-errors";
import { UPLOAD_SCOPE_RULES } from "@/lib/upload-rules";
import { cn } from "@/lib/utils";
import { Level, Post, PostTypeEnum, Subject, Tag } from "@/types";

const POST_RULE = UPLOAD_SCOPE_RULES.post_attachment;

type PostEditDraftValues = {
  post_type: PostTypeEnum;
  title: string;
  body: string;
  subject_id: string;
  level_id: string;
  tags: string[];
};

export function UpdatePostForm({
  post,
  subjects,
  levels,
  tags: _tags,
  userRole,
  writeLocked,
}: {
  post: Post;
  subjects: Subject[];
  levels: Level[];
  tags: Tag[];
  userRole: string;
  writeLocked: boolean;
}) {
  void _tags;
  const router = useRouter();
  const { getToken } = useAuth();
  const updatePostMutation = useUpdatePost();
  const removeAttachmentMutation = useRemovePostAttachment();

  const errorBannerRef = useRef<HTMLDivElement>(null);
  const appliedDraftRef = useRef(false);

  const [mode, setMode] = useState<"write" | "preview">("write");
  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [errorFocusNonce, setErrorFocusNonce] = useState(0);
  const [didSubmit, setDidSubmit] = useState(false);
  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const [slowServerNotice, setSlowServerNotice] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [existingAttachment, setExistingAttachment] = useState<{
    url: string;
    name: string;
  } | null>(
    post.attachment_url
      ? {
          url: post.attachment_url,
          name: post.attachment_name || "Attachment",
        }
      : null
  );

  const canAnnounce = userRole === "ADMIN" || userRole === "SUPERADMIN";
  const subjectRequired = userRole === "USER" || userRole === "MODERATOR";

  const formSchema = useMemo(
    () =>
      z.object({
        post_type: z.enum(["QUESTION", "SHARING", "ANNOUNCEMENT"]),
        title: z
          .string()
          .trim()
          .min(1, "Title is required")
          .max(100, "Max 100 characters"),
        body: z
          .string()
          .trim()
          .min(1, "Body is required")
          .max(3000, "Max 3000 characters"),
        subject_id: subjectRequired
          ? z.string().min(1, "Subject is required")
          : z.string().optional().or(z.literal("")),
        level_id: subjectRequired
          ? z.string().min(1, "Level is required")
          : z.string().optional().or(z.literal("")),
        tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
      }),
    [subjectRequired]
  );

  type FormValues = z.infer<typeof formSchema>;

  const initialValues = useMemo<FormValues>(
    () => ({
      post_type: post.post_type || "QUESTION",
      title: post.title,
      body: post.body,
      subject_id: post.subject ?? "",
      level_id: post.level ?? "",
      tags: (post.tags_data || []).map((t) => t.name),
    }),
    [post]
  );

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const watchedValues = useWatch({ control });

  const {
    items,
    batchError,
    isUploading,
    addFiles,
    removeFile,
    cancelUpload,
    uploadAll,
    retryItem,
    reset: resetUploads,
  } = useStagedUploads({
    scope: "post_attachment",
    maxConcurrency: 1,
  });

  const isEditDraftEmpty = useCallback(
    (draft: Partial<PostEditDraftValues>) => {
      return (
        !draft.title?.trim() &&
        !draft.body?.trim() &&
        !draft.subject_id &&
        !draft.level_id &&
        (!draft.tags || draft.tags.length === 0)
      );
    },
    []
  );

  const {
    restoredDraft,
    hasRestoredDraft,
    saveDraft,
    clearDraft,
    dismissRestoredNotice,
  } = useDraftPersistence<PostEditDraftValues>({
    storageKey: `draft:post:edit:${post.id}`,
    enabled: !writeLocked,
    isEmpty: isEditDraftEmpty,
  });

  useEffect(() => {
    if (!restoredDraft || appliedDraftRef.current) return;
    appliedDraftRef.current = true;

    const restoredType =
      restoredDraft.post_type === "ANNOUNCEMENT" && !canAnnounce
        ? initialValues.post_type
        : restoredDraft.post_type || initialValues.post_type;

    reset({
      post_type: restoredType,
      title: restoredDraft.title ?? initialValues.title,
      body: restoredDraft.body ?? initialValues.body,
      subject_id: restoredDraft.subject_id ?? initialValues.subject_id,
      level_id: restoredDraft.level_id ?? initialValues.level_id,
      tags: Array.isArray(restoredDraft.tags)
        ? restoredDraft.tags
        : initialValues.tags,
    });
  }, [restoredDraft, canAnnounce, initialValues, reset]);

  useEffect(() => {
    if (!isDirty || writeLocked || didSubmit) return;
    saveDraft({
      post_type: watchedValues.post_type ?? initialValues.post_type,
      title: watchedValues.title ?? "",
      body: watchedValues.body ?? "",
      subject_id: watchedValues.subject_id ?? "",
      level_id: watchedValues.level_id ?? "",
      tags: watchedValues.tags ?? [],
    });
  }, [
    watchedValues,
    isDirty,
    writeLocked,
    didSubmit,
    initialValues.post_type,
    saveDraft,
  ]);

  useEffect(() => {
    if (errorFocusNonce === 0) return;
    errorBannerRef.current?.focus();
  }, [errorFocusNonce]);

  useEffect(() => {
    if (submitStage === "idle") {
      return;
    }
    const timer = setTimeout(() => {
      setSlowServerNotice(true);
    }, 6000);
    return () => {
      clearTimeout(timer);
      setSlowServerNotice(false);
    };
  }, [submitStage]);

  useEffect(() => {
    const hasUnsavedWork =
      (isDirty || items.length > 0 || isUploading) && !didSubmit;
    if (!hasUnsavedWork) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, items.length, isUploading, didSubmit]);

  const resolveUploadToken = useCallback(
    () => getMutationAuthToken(getToken),
    [getToken]
  );

  const handleDiscardDraft = () => {
    clearDraft();
    reset(initialValues);
    resetUploads();
    setServerError("");
    setServerFieldErrors({});
  };

  const handleConfirmRemoveAttachment = async () => {
    if (writeLocked) return;
    try {
      await removeAttachmentMutation.mutateAsync(post.id);
      setExistingAttachment(null);
      setRemoveDialogOpen(false);
      toast.success("Attachment removed");
    } catch (err: unknown) {
      const extracted = extractApiFieldErrors(
        err,
        {},
        "Failed to remove attachment."
      );
      toast.error(extracted.serverMessage);
    }
  };

  const isBusy =
    submitStage !== "idle" ||
    isUploading ||
    removeAttachmentMutation.isPending;

  const onInvalid = () => {
    setServerError("Please review the highlighted fields before submitting.");
    setServerFieldErrors({});
    setErrorFocusNonce((prev) => prev + 1);
  };

  const onSubmit = async (data: FormValues) => {
    if (writeLocked) return;

    setServerError("");
    setServerFieldErrors({});
    setSlowServerNotice(false);

    let succeeded = false;
    try {
      let uploaded: Array<{
        file_key: string;
        file_name: string;
        public_url?: string;
      }> = [];

      if (items.length > 0) {
        setSubmitStage("uploading");
        uploaded = await uploadAll(resolveUploadToken);
      }

      setSubmitStage("saving");
      await updatePostMutation.mutateAsync({
        postId: post.id,
        post_type: data.post_type,
        title: data.title.trim(),
        body: data.body.trim(),
        subject: data.subject_id ? data.subject_id : null,
        level: data.level_id ? data.level_id : null,
        tags: data.tags,
        uploaded_attachment: uploaded[0]
          ? {
              file_key: uploaded[0].file_key,
              file_name: uploaded[0].file_name,
            }
          : undefined,
      });

      succeeded = true;
      setDidSubmit(true);
      clearDraft();
      resetUploads();
      toast.success("Changes saved!");
      router.push(`/posts/${post.id}`);
    } catch (err: unknown) {
      const extracted = extractApiFieldErrors(err, {
        subject: "subject_id",
        level: "level_id",
        tags: "tags",
        file: "attachment",
        attachment: "attachment",
        uploaded_attachment: "attachment",
      });
      setServerError(extracted.serverMessage);
      setServerFieldErrors(extracted.fieldErrors);
      applyFieldErrorsToForm(extracted.fieldErrors, setError);
      setErrorFocusNonce((prev) => prev + 1);
    } finally {
      if (!succeeded) {
        setSubmitStage("idle");
        setSlowServerNotice(false);
      }
    }
  };

  const activeUploadProgress = items[0]?.progress ?? 0;
  const submitLabel =
    submitStage === "uploading"
      ? `Uploading (${activeUploadProgress}%)…`
      : submitStage === "saving"
        ? "Saving…"
        : "Save Changes";

  const activePostType = watchedValues.post_type ?? initialValues.post_type;
  const bodyLength = (watchedValues.body ?? "").length;
  const showAnnouncementOption =
    canAnnounce || post.post_type === "ANNOUNCEMENT";

  return (
    <>
      <ArchivalComposerShell
        backHref={`/posts/${post.id}`}
        backLabel="Post"
        cancelHref={`/posts/${post.id}`}
        mode={mode}
        onModeChange={setMode}
        charCount={bodyLength}
        maxChars={3000}
        submitLabel={submitLabel}
        isSubmitting={isBusy}
        submitDisabled={writeLocked}
        isUploading={isUploading}
        onCancelUpload={() => cancelUpload()}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        autosaveLabel={isDirty ? "Unsaved edits saved locally" : undefined}
        draftBanner={{
          visible: hasRestoredDraft,
          message: "Restored your unsaved edits.",
          onDiscard: handleDiscardDraft,
          onDismiss: dismissRestoredNotice,
        }}
        errorBanner={
          <div className="space-y-3">
            {writeLocked && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
              >
                Your account is restricted. You cannot edit posts at this time.
              </div>
            )}
            <FormErrorBanner
              ref={errorBannerRef}
              serverMessage={serverError}
              fieldErrors={serverFieldErrors}
            />
          </div>
        }
        coldStartNotice={
          slowServerNotice && submitStage !== "idle" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground"
            >
              <span>
                Still working — the server may be waking up. Your edits are safe.
              </span>
              {isUploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => cancelUpload()}
                  className="min-h-[36px] sm:min-h-[28px]"
                >
                  Cancel upload
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        <MetadataPillBar
          errors={[
            errors.post_type?.message,
            errors.subject_id?.message,
            errors.level_id?.message,
            errors.tags?.message,
          ]}
        >
          <div
            role="radiogroup"
            aria-label="Post type"
            className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5"
          >
            {(
              [
                { value: "QUESTION", label: "Question" },
                { value: "SHARING", label: "Sharing" },
                ...(showAnnouncementOption
                  ? [{ value: "ANNOUNCEMENT" as const, label: "Announcement" }]
                  : []),
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={activePostType === opt.value}
                disabled={isBusy || writeLocked}
                onClick={() =>
                  setValue("post_type", opt.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "min-h-[40px] sm:min-h-[30px] cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activePostType === opt.value
                    ? "border border-border bg-card text-foreground shadow-2xs"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <MetadataSelectPill
            id="edit-post-subject"
            label="Subject"
            required={subjectRequired}
            invalid={!!errors.subject_id}
            disabled={isBusy || writeLocked}
            {...register("subject_id")}
          >
            <option value="">
              {subjectRequired ? "Subject *" : "Subject (Optional)"}
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </MetadataSelectPill>

          <MetadataSelectPill
            id="edit-post-level"
            label="Level"
            required={subjectRequired}
            invalid={!!errors.level_id}
            disabled={isBusy || writeLocked}
            {...register("level_id")}
          >
            <option value="">
              {subjectRequired ? "Level *" : "Level (Optional)"}
            </option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </MetadataSelectPill>

          <span className="inline-flex min-h-[30px] items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
            <Clock className="size-3 text-warning" aria-hidden="true" />
            <span>30d auto-archive</span>
          </span>
        </MetadataPillBar>

        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput
              value={field.value || []}
              onChange={field.onChange}
              maxTags={3}
              disabled={isBusy || writeLocked}
              error={errors.tags?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <ArchivalTitleInput
              id="edit-post-title"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={100}
              disabled={isBusy || writeLocked}
              placeholder="Clear, searchable title..."
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
              <MarkdownMathEditor
                id="edit-post-body"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                mode={mode}
                variant="borderless"
                maxLength={3000}
                required
                disabled={isBusy || writeLocked}
                aria-invalid={!!errors.body}
                placeholder="Explain your question or share notes with the community..."
              />
            )}
          />
          {errors.body?.message && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.body.message}
            </p>
          )}
        </div>

        <section
          aria-label="Attachment"
          className="mt-6 space-y-3 border-t border-border pt-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Attachment (Optional)
            </h2>
            <span className="font-mono tabular-nums text-xs text-muted-foreground">
              Max {POST_RULE.maxFiles} file · {POST_RULE.maxSizeMB} MB
            </span>
          </div>

          {existingAttachment && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Current attachment:{" "}
                  <span className="text-foreground">
                    {existingAttachment.name}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRemoveDialogOpen(true)}
                  disabled={isBusy || writeLocked}
                  className="min-h-[44px] sm:min-h-[32px] gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>Remove attachment</span>
                </Button>
              </div>

              <PostAttachment
                url={existingAttachment.url}
                filename={existingAttachment.name}
              />

              {items.length > 0 && (
                <p className="text-xs font-medium text-warning">
                  Uploading a new file will replace the current attachment when you save.
                </p>
              )}
            </div>
          )}

          <FileDropzone
            items={items}
            onAddFiles={addFiles}
            onRemoveItem={removeFile}
            onRetryItem={(id) => void retryItem(id, resolveUploadToken)}
            scope="post_attachment"
            sizeMode="per-file"
            disabled={isBusy || writeLocked}
            label={
              existingAttachment
                ? "Upload replacement attachment"
                : "Upload post attachment"
            }
            helperText={`JPG, PNG, WebP, or PDF · Max ${POST_RULE.maxSizeMB} MB`}
            error={batchError || serverFieldErrors.attachment?.[0] || undefined}
          />
        </section>
      </ArchivalComposerShell>

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove attachment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &ldquo;{existingAttachment?.name}
              &rdquo; from this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={removeAttachmentMutation.isPending}
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemoveAttachment}
              disabled={removeAttachmentMutation.isPending}
            >
              {removeAttachmentMutation.isPending ? (
                <>
                  <Loader2
                    className="mr-1.5 size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Removing…
                </>
              ) : (
                "Remove attachment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
