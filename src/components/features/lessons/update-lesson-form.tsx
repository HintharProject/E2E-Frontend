"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Subject, Level, Tag, Lesson } from "@/types";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm } from "@/lib/form-errors";
import { uploadDirectlyToB2 } from "@/lib/storage";



const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export function UpdateLessonForm({
  lesson,
  subjects,
  levels,
  tags,
  writeLocked,
}: {
  lesson: Lesson;
  subjects: Subject[];
  levels: Level[];
  tags: Tag[];
  writeLocked: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const submissionKey = `update_lesson_${lesson.id}`;
  const { startBackgroundSubmission, getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment? This action cannot be undone.")) return;
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      await apiFetch(`/lessons/${lesson.id}/attachments/${attachmentId}/`, token, {
        method: "DELETE",
      });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lesson.id] });
      router.refresh();
      toast.success("Attachment deleted");
    } catch (err: any) {
      toast.error("Failed to delete attachment: " + err.message);
    }
  };

  const formSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
    body: z.string().min(1, "Body is required").max(5000, "Max 5000 characters"),
    subject_id: z.string().min(1, "Subject is required"),
    level_id: z.string().min(1, "Level is required"),
    tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
    embedded_video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    state: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    attachments: z
      .any()
      .optional()
      .refine(
        (files) => !files || files.length <= 5,
        "Max 5 files allowed."
      )
      .refine(
        (files) => !files || Array.from(files as File[]).every((file) => file.size <= MAX_FILE_SIZE),
        "Max file size is 20MB per file."
      )
      .refine(
        (files) => !files || Array.from(files as File[]).every((file) => ACCEPTED_FILE_TYPES.includes(file.type) || file.name.match(/\.(pdf|docx|pptx|zip|jpe?g|png|gif|webp)$/i)),
        "Only .pdf, .docx, .pptx, .zip, and images are supported."
      ),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: lesson.title,
      body: lesson.body,
      subject_id: lesson.subject ?? "",
      level_id: lesson.level ?? "",
      tags: (lesson.tags_data || []).map((t) => t.name).length > 0 ? (lesson.tags_data || []).map((t) => t.name) : (lesson.tags || []),
      embedded_video_url: lesson.embedded_video_url ?? "",
      state: lesson.state as any,
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
        setValue("attachments", failed.files, { shouldValidate: true });
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
    router.push(`/lessons/${lesson.id}`);

    startBackgroundSubmission({
      key: submissionKey,
      loadingMessage: "Saving changes...",
      successMessage: "Changes saved successfully!",
      returnUrl: `/lessons/${lesson.id}/edit`,
      formValues: data,
      files: data.attachments,
      fieldMapping: {
        subject: "subject_id",
        level: "level_id",
        tags: "tags",
        embedded_video_url: "embedded_video_url",
        file: "attachments",
        attachments: "attachments",
      },
      router,
      execute: async () => {
        const token = await getToken();
        if (!token) throw new Error("Unauthorized");

        const payload = {
          title: data.title,
          body: data.body,
          subject: data.subject_id,
          level: data.level_id,
          state: data.state,
          ...(data.embedded_video_url && { embedded_video_url: data.embedded_video_url }),
          tags: data.tags,
        };

        await apiFetch(`/lessons/${lesson.id}/`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (data.attachments && data.attachments.length > 0) {
          for (let i = 0; i < data.attachments.length; i++) {
            const uploaded = await uploadDirectlyToB2(data.attachments[i], "lesson_attachment", token);
            await apiFetch(`/lessons/${lesson.id}/attachments/`, token, {
              method: "POST",
              body: JSON.stringify(uploaded),
            });
          }
        }

        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        queryClient.invalidateQueries({ queryKey: ["lesson", lesson.id] });
      },
      onSuccessUrl: () => `/lessons/${lesson.id}`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />

      <Field label="Title" error={errors.title?.message}>
        <Input
          {...register("title")}
          placeholder="Lesson title"
          aria-invalid={!!errors.title}
        />
      </Field>

      <Field label="Body" error={errors.body?.message}>
        <Textarea
          {...register("body")}
          aria-invalid={!!errors.body}
          className="min-h-32"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject *" error={errors.subject_id?.message}>
          <Select {...register("subject_id")} aria-invalid={!!errors.subject_id}>
            <option value="">Select…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Level *" error={errors.level_id?.message}>
          <Select {...register("level_id")} aria-invalid={!!errors.level_id}>
            <option value="">Select…</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Controller
        control={control}
        name="tags"
        render={({ field }) => (
          <TagInput
            value={field.value || []}
            onChange={field.onChange}
            maxTags={3}
            error={errors.tags?.message}
          />
        )}
      />

      <Field label="Embedded video URL (optional)" error={errors.embedded_video_url?.message}>
        <Input
          {...register("embedded_video_url")}
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          aria-invalid={!!errors.embedded_video_url}
        />
      </Field>

      <Field label="State" error={errors.state?.message}>
        <Select {...register("state")} aria-invalid={!!errors.state}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </Field>

      <Field label="Add new attachments (optional · max 5 · 20MB · pdf/docx/pptx/zip/images)">
        <FileDropzone 
          onFilesSelected={(files) => {
            setValue("attachments", files, { shouldValidate: true });
          }}
          maxFiles={5}
          maxSizeMB={20}
          acceptedTypes={ACCEPTED_FILE_TYPES}
          error={errors.attachments?.message as string}
        />
        {lesson.attachments && lesson.attachments.length > 0 && (
          <div className="mt-2 text-xs text-ink-muted">
            <p>Current attachments:</p>
            <div className="mt-2 flex flex-col gap-3">
              {lesson.attachments.map(att => (
                <div key={att.id} className="relative group">
                  <PostAttachment url={att.file_url} filename={att.file_name} />
                  <button 
                    type="button" 
                    onClick={() => handleDeleteAttachment(att.id)} 
                    className="absolute -top-2 -right-2 bg-card border border-line text-danger hover:text-danger hover:bg-danger/10 p-1.5 rounded-full shadow-sm transition-colors z-10" 
                    title="Delete attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2">Note: Uploading new files will add to these.</p>
          </div>
        )}
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={writeLocked}>
          Save Changes
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href={`/lessons/${lesson.id}`} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
