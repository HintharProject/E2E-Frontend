"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import Link from "next/link";
import { Subject, Level, Tag, Post } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm } from "@/lib/form-errors";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function UpdatePostForm({
  post,
  subjects,
  levels,
  tags,
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
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const submissionKey = `update_post_${post.id}`;
  const { startBackgroundSubmission, getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});
  const [existingAttachment, setExistingAttachment] = useState<{ url: string; name: string } | null>(
    post.attachment_url ? { url: post.attachment_url, name: post.attachment_name || "Attachment" } : null
  );

  const handleRemoveExistingAttachment = async () => {
    const toastId = toast.loading("Removing attachment...");
    try {
      const token = await getToken();
      await apiFetch(`/posts/${post.id}/attachment/remove/`, token, {
        method: "DELETE",
      });
      setExistingAttachment(null);
      toast.success("Attachment removed", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err: any) {
      toast.error("Failed to remove attachment", { id: toastId });
    }
  };

  const canAnnounce = userRole === "TEACHER" || userRole === "SENIOR_STUDENT" || userRole === "ADMIN";
  const subjectRequired = userRole === "STUDENT";

  const formSchema = z.object({
    post_type: z.enum(["QUESTION", "SHARING", "ANNOUNCEMENT"]),
    title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
    body: z.string().min(1, "Body is required").max(3000, "Max 3000 characters"),
    subject_id: subjectRequired ? z.string().min(1, "Subject is required") : z.string().optional().or(z.literal("")),
    level_id: subjectRequired ? z.string().min(1, "Level is required") : z.string().optional().or(z.literal("")),
    tag_id: z.string().optional(),
    attachment: z
      .any()
      .optional()
      .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
      .refine(
        (files) => !files || files.length === 0 || ACCEPTED_FILE_TYPES.includes(files[0].type),
        "Only .jpg, .png, and .pdf formats are supported."
      ),
  });

  type FormValues = z.infer<typeof formSchema>;

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
      post_type: post.post_type as any,
      title: post.title,
      body: post.body,
      subject_id: post.subject ?? "",
      level_id: post.level ?? "",
      tag_id: post.tags_data?.[0]?.id ?? "",
    },
  });

  // Recover state and field errors if background update failed
  useEffect(() => {
    const failed = getFailedSubmission(submissionKey);
    if (failed) {
      if (failed.formValues) {
        reset(failed.formValues as FormValues);
      }
      if (failed.files && failed.files.length > 0) {
        setValue("attachment", failed.files, { shouldValidate: true });
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

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setServerFieldErrors({});

    // Minimize form and navigate immediately
    router.push(`/posts/${post.id}`);

    startBackgroundSubmission({
      key: submissionKey,
      loadingMessage: "Saving changes...",
      successMessage: "Changes saved successfully!",
      returnUrl: `/posts/${post.id}/edit`,
      formValues: data,
      files: data.attachment,
      fieldMapping: {
        subject: "subject_id",
        level: "level_id",
        tags: "tag_id",
        file: "attachment",
        attachment: "attachment",
      },
      router,
      execute: async () => {
        const token = await getToken();
        if (!token) throw new Error("Unauthorized");

        const payload = {
          post_type: data.post_type,
          title: data.title,
          body: data.body,
          ...(data.subject_id && { subject: data.subject_id }),
          ...(data.level_id && { level: data.level_id }),
          ...(data.tag_id && { tags: [data.tag_id] }),
        };

        const res = await apiFetch<Post>(`/posts/${post.id}/`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (data.attachment && data.attachment.length > 0) {
          const formData = new FormData();
          formData.append("file", data.attachment[0]);
          await apiFetch(`/posts/${post.id}/attachment/`, token, {
            method: "POST",
            body: formData,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["post", post.id] });
        return res;
      },
      onSuccessUrl: () => `/posts/${post.id}`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />
      
      <Field label="Post type">
        <select {...register("post_type")} className={`${inputClass} ${errors.post_type ? errorClass : ""}`}>
          <option value="QUESTION">Question</option>
          <option value="SHARING">Sharing</option>
          {canAnnounce && <option value="ANNOUNCEMENT">Announcement</option>}
        </select>
        {errors.post_type && <p className="mt-1 text-xs text-danger">{errors.post_type.message}</p>}
      </Field>

      <Field label="Title (max 100)">
        <input
          {...register("title")}
          className={`${inputClass} ${errors.title ? errorClass : ""}`}
          placeholder="Clear, searchable title"
        />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
      </Field>

      <Field label="Body (max 3000)">
        <textarea
          {...register("body")}
          className={`${inputClass} min-h-32 ${errors.body ? errorClass : ""}`}
        />
        {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Subject${subjectRequired ? " *" : " (optional)"}`}>
          <select {...register("subject_id")} className={`${inputClass} ${errors.subject_id ? errorClass : ""}`}>
            <option value="">Select…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.subject_id && <p className="mt-1 text-xs text-danger">{errors.subject_id.message}</p>}
        </Field>

        <Field label={`Level${subjectRequired ? " *" : " (optional)"}`}>
          <select {...register("level_id")} className={`${inputClass} ${errors.level_id ? errorClass : ""}`}>
            <option value="">Select…</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {errors.level_id && <p className="mt-1 text-xs text-danger">{errors.level_id.message}</p>}
        </Field>
      </div>

      <Field label="Custom tag (optional)">
        <select {...register("tag_id")} className={inputClass}>
          <option value="">Select tag...</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </Field>

      <Field label="New attachment (optional · max 1 · 5MB · jpg/png/pdf)">
        {existingAttachment && (
          <div className="mb-4 flex items-center justify-between p-2 text-sm border border-line rounded-md bg-secondary">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="truncate flex-1 min-w-0 font-medium">{existingAttachment.name}</span>
            </div>
            <Button type="button" variant="ghost" size="xs" onClick={handleRemoveExistingAttachment} className="shrink-0 text-ink-muted hover:text-danger">
              Remove
            </Button>
          </div>
        )}
        <FileDropzone 
          onFilesSelected={(files) => {
            setValue("attachment", files, { shouldValidate: true });
          }}
          maxFiles={1}
          maxSizeMB={5}
          acceptedTypes={ACCEPTED_FILE_TYPES}
          error={errors.attachment?.message as string}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={writeLocked}>
          Save Changes
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href={`/posts/${post.id}`} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
