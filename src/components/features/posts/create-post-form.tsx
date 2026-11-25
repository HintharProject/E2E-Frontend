"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@clerk/nextjs";
import { Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Input } from "@/components/ui/input";
import { MarkdownMathEditor } from "@/components/ui/markdown-math-editor";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
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
      ? `Uploading attachment (${activeUploadProgress}%)…`
      : submitStage === "saving"
        ? "Publishing post…"
        : "Publish post";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-card"
    >
      {hasRestoredDraft && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-foreground"
        >
          <span>Restored your unsaved draft.</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleDiscardDraft}
              className="min-h-[44px] sm:min-h-[28px] gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              <span>Discard</span>
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
        label="Post type"
        htmlFor="create-post-type"
        required
        error={errors.post_type?.message}
      >
        <Select
          id="create-post-type"
          {...register("post_type")}
          disabled={isBusy || writeLocked}
          aria-invalid={!!errors.post_type}
        >
          <option value="QUESTION">Question</option>
          <option value="SHARING">Sharing</option>
          {canAnnounce && <option value="ANNOUNCEMENT">Announcement</option>}
        </Select>
      </Field>

      <Field
        label="Title"
        htmlFor="create-post-title"
        required
        description="Up to 100 characters."
        error={errors.title?.message}
      >
        <Input
          id="create-post-title"
          {...register("title")}
          maxLength={100}
          disabled={isBusy || writeLocked}
          placeholder="Clear, searchable title"
          aria-invalid={!!errors.title}
        />
      </Field>

      <Field
        label="Body"
        htmlFor="create-post-body"
        required
        error={errors.body?.message}
      >
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
              maxLength={3000}
              required
              disabled={isBusy || writeLocked}
              aria-invalid={!!errors.body}
              placeholder="Explain your question or share notes with the community..."
            />
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Subject"
          htmlFor="create-post-subject"
          required={subjectRequired}
          description={subjectRequired ? undefined : "Optional for Announcements."}
          error={errors.subject_id?.message}
        >
          <Select
            id="create-post-subject"
            {...register("subject_id")}
            disabled={isBusy || writeLocked}
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
          htmlFor="create-post-level"
          required={subjectRequired}
          description={subjectRequired ? undefined : "Optional for Announcements."}
          error={errors.level_id?.message}
        >
          <Select
            id="create-post-level"
            {...register("level_id")}
            disabled={isBusy || writeLocked}
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

      <Field label="Tags" asGroup>
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
      </Field>

      <Field
        label="Attachment"
        asGroup
        description={`Optional. Max ${POST_RULE.maxFiles} file up to ${POST_RULE.maxSizeMB} MB (${POST_RULE.allowedExtensions.join(", ")}).`}
      >
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
      </Field>

      {slowServerNotice && submitStage !== "idle" && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground"
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
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" disabled={writeLocked || isBusy}>
          {isBusy ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="mr-1.5 size-4" aria-hidden="true" />
          )}
          <span className={submitStage === "uploading" ? "font-mono tabular-nums" : undefined}>
            {submitLabel}
          </span>
        </Button>
        <Button
          variant="secondary"
          nativeButton={false}
          disabled={isBusy}
          render={<Link href="/forum" />}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
