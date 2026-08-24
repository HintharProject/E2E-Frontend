"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Subject, Level, Tag, Lesson } from "@/types";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment? This action cannot be undone.")) return;
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      await apiFetch(`/lessons/${lesson.id}/attachment/${attachmentId}/`, token, {
        method: "DELETE",
      });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lesson.id] });
      router.refresh();
    } catch (err: any) {
      alert("Failed to delete attachment: " + err.message);
    }
  };

  const formSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
    body: z.string().min(1, "Body is required").max(5000, "Max 5000 characters"),
    subject_id: z.string().min(1, "Subject is required"),
    level_id: z.string().min(1, "Level is required"),
    tag_id: z.string().optional(),
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
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: lesson.title,
      body: lesson.body,
      subject_id: lesson.subject ?? "",
      level_id: lesson.level ?? "",
      tag_id: lesson.tags?.[0] ?? "",
      embedded_video_url: lesson.embedded_video_url ?? "",
      state: lesson.state as any,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const payload = {
        title: data.title,
        body: data.body,
        subject: data.subject_id,
        level: data.level_id,
        state: data.state,
        ...(data.embedded_video_url && { embedded_video_url: data.embedded_video_url }),
        ...(data.tag_id && { tags: [data.tag_id] }),
      };

      await apiFetch(`/lessons/${lesson.id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (data.attachments && data.attachments.length > 0) {
        for (let i = 0; i < data.attachments.length; i++) {
          const formData = new FormData();
          formData.append("file", data.attachments[i]);
          await apiFetch(`/lessons/${lesson.id}/attachments/`, token, {
            method: "POST",
            body: formData,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lesson.id] });
      router.push(`/lessons/${lesson.id}`);
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      {serverError && <div className="text-danger text-sm">{serverError}</div>}

      <Field label="Title">
        <input
          {...register("title")}
          className={`${inputClass} ${errors.title ? errorClass : ""}`}
          placeholder="Lesson title"
        />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
      </Field>

      <Field label="Body">
        <textarea
          {...register("body")}
          className={`${inputClass} min-h-32 ${errors.body ? errorClass : ""}`}
        />
        {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject *">
          <select {...register("subject_id")} className={`${inputClass} ${errors.subject_id ? errorClass : ""}`}>
            <option value="">Select…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.subject_id && <p className="mt-1 text-xs text-danger">{errors.subject_id.message}</p>}
        </Field>

        <Field label="Level *">
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

      <Field label="Embedded video URL (optional)">
        <input
          {...register("embedded_video_url")}
          className={`${inputClass} ${errors.embedded_video_url ? errorClass : ""}`}
          type="url"
          placeholder="https://youtube.com/watch?v=..."
        />
        {errors.embedded_video_url && <p className="mt-1 text-xs text-danger">{errors.embedded_video_url.message}</p>}
      </Field>

      <Field label="State">
        <select {...register("state")} className={`${inputClass} ${errors.state ? errorClass : ""}`}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        {errors.state && <p className="mt-1 text-xs text-danger">{errors.state.message}</p>}
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
        <Button type="submit" disabled={writeLocked || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href={`/lessons/${lesson.id}`} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
