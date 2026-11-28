"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@clerk/nextjs";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { useCreatePost } from "@/hooks/use-posts";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { getMutationAuthToken } from "@/lib/client-auth";
import {
  applyFieldErrorsToForm,
  extractApiFieldErrors,
} from "@/lib/form-errors";
import { UPLOAD_SCOPE_RULES } from "@/lib/upload-rules";
import { cn } from "@/lib/utils";

const POST_RULE = UPLOAD_SCOPE_RULES.post_attachment;

type PostDraftValues = {
  post_type: "QUESTION" | "SHARING" | "ANNOUNCEMENT";
  title: string;
  body: string;
  subject_id: string;
  level_id: string;
  tags: string[];
};

export function CreatePostForm({
  userRole,
  writeLocked,
}: {
  userRole: string;
  writeLocked: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const createPostMutation = useCreatePost();

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

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

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

  const defaultValues = useMemo<FormValues>(
    () => ({
      post_type: "QUESTION",
      title: "",
      body: "",
      subject_id: "",
      level_id: "",
      tags: [],
    }),
    []
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
    defaultValues,
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

  const isPostDraftEmpty = useCallback((draft: Partial<PostDraftValues>) => {
    return (
      !draft.title?.trim() &&
      !draft.body?.trim() &&
      !draft.subject_id &&
      !draft.level_id &&
      (!draft.tags || draft.tags.length === 0)
    );
  }, []);

  const {
    restoredDraft,
    hasRestoredDraft,
    saveDraft,
    clearDraft,
    dismissRestoredNotice,
  } = useDraftPersistence<PostDraftValues>({
    storageKey: "draft:post:new",
    enabled: !writeLocked,
    isEmpty: isPostDraftEmpty,
  });

  useEffect(() => {
    if (!restoredDraft || appliedDraftRef.current) return;
    appliedDraftRef.current = true;

    const restoredType =
      restoredDraft.post_type === "ANNOUNCEMENT" && !canAnnounce
        ? "QUESTION"
        : restoredDraft.post_type || "QUESTION";

    reset({
      post_type: restoredType,
      title: restoredDraft.title ?? "",
      body: restoredDraft.body ?? "",
      subject_id: restoredDraft.subject_id ?? "",
      level_id: restoredDraft.level_id ?? "",
      tags: Array.isArray(restoredDraft.tags) ? restoredDraft.tags : [],
    });
  }, [restoredDraft, canAnnounce, reset]);

  useEffect(() => {
    if (!isDirty || writeLocked || didSubmit) return;
    saveDraft({
      post_type: watchedValues.post_type ?? "QUESTION",
      title: watchedValues.title ?? "",
      body: watchedValues.body ?? "",
      subject_id: watchedValues.subject_id ?? "",
      level_id: watchedValues.level_id ?? "",
      tags: watchedValues.tags ?? [],
    });
  }, [watchedValues, isDirty, writeLocked, didSubmit, saveDraft]);

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
    reset(defaultValues);
    resetUploads();
    setServerError("");
    setServerFieldErrors({});
  };

  const isBusy = submitStage !== "idle" || isUploading;

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
      const created = await createPostMutation.mutateAsync({
        post_type: data.post_type,
        title: data.title.trim(),
        body: data.body.trim(),
        ...(data.subject_id ? { subject: data.subject_id } : {}),
        ...(data.level_id ? { level: data.level_id } : {}),
        tags: data.tags,
        uploaded_attachment: uploaded[0]
          ? {
              file_key: uploaded[0].file_key,
              file_name: uploaded[0].file_name,
            }
          : null,
      });

      succeeded = true;
      setDidSubmit(true);
      clearDraft();
      resetUploads();
      toast.success("Post published!");
      router.push(`/posts/${created.id}`);
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
        ? "Publishing…"
        : "Publish Post";

  const activePostType = watchedValues.post_type ?? "QUESTION";
  const bodyLength = (watchedValues.body ?? "").length;

  return (
    <ArchivalComposerShell
      backHref="/forum"
      backLabel="Forum"
      cancelHref="/forum"
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
      autosaveLabel={isDirty ? "Draft saved locally" : undefined}
      draftBanner={{
        visible: hasRestoredDraft,
        message: "Restored your unsaved draft.",
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
        slowServerNotice && submitStage !== "idle" ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground"
          >
            <span>
              Still working — the server may be waking up. Your draft and attachment are safe.
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
              ...(canAnnounce
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
          id="create-post-subject"
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
          id="create-post-level"
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
            id="create-post-title"
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
              id="create-post-body"
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
        className="mt-6 space-y-2.5 border-t border-border pt-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Attachment (Optional)
          </h2>
          <span className="font-mono tabular-nums text-xs text-muted-foreground">
            Max {POST_RULE.maxFiles} file · {POST_RULE.maxSizeMB} MB
          </span>
        </div>

        <FileDropzone
          items={items}
          onAddFiles={addFiles}
          onRemoveItem={removeFile}
          onRetryItem={(id) => void retryItem(id, resolveUploadToken)}
          scope="post_attachment"
          sizeMode="per-file"
          disabled={isBusy || writeLocked}
          label="Upload post attachment"
          helperText={`JPG, PNG, WebP, or PDF · Max ${POST_RULE.maxSizeMB} MB`}
          error={batchError || serverFieldErrors.attachment?.[0] || undefined}
        />
      </section>
    </ArchivalComposerShell>
  );
}
