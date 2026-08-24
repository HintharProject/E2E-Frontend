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
import { Subject, Level, Tag, Lesson } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm } from "@/lib/form-errors";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

const MAX_TOTAL_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
  body: z.string().min(1, "Body is required").max(5000, "Max 5000 characters"),
  subject_id: z.string().min(1, "Subject is required"),
  level_id: z.string().min(1, "Level is required"),
  tag_id: z.string().optional(),
  embedded_video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  state: z.enum(["DRAFT", "PUBLISHED"]),
  resources: z
    .any()
    .optional()
    .refine((files) => !files || files.length <= 5, "Maximum 5 files allowed.")
    .refine((files) => {
      if (!files || files.length === 0) return true;
      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
      }
      return totalSize <= MAX_TOTAL_FILE_SIZE;
    }, "Total file size must not exceed 20MB.")
    .refine((files) => {
      if (!files || files.length === 0) return true;
      for (let i = 0; i < files.length; i++) {
        if (!ACCEPTED_FILE_TYPES.includes(files[i].type) && !files[i].name.match(/\.(pdf|docx|pptx|zip|jpe?g|png|gif|webp)$/i)) {
          return false;
        }
      }
      return true;
    }, "Only .pdf, .docx, .pptx, .zip, and images are supported."),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateLessonForm({
  subjects,
  levels,
  tags,
}: {
  subjects: Subject[];
  levels: Level[];
  tags: Tag[];
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { startBackgroundSubmission, getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});

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
      title: "",
      body: "",
      subject_id: "",
      level_id: "",
      tag_id: "",
      embedded_video_url: "",
      state: "DRAFT",
    },
  });

  // Recover state and field errors if background creation failed
  useEffect(() => {
    const failed = getFailedSubmission("create_lesson");
    if (failed) {
      if (failed.formValues) {
        reset(failed.formValues as FormValues);
      }
      if (failed.files && failed.files.length > 0) {
        setValue("resources", failed.files, { shouldValidate: true });
      }
      if (failed.serverMessage) {
        setServerError(failed.serverMessage);
      }
      if (failed.fieldErrors) {
        setServerFieldErrors(failed.fieldErrors);
        applyFieldErrorsToForm(failed.fieldErrors, setError);
      }
      clearFailedSubmission("create_lesson");
    }
  }, [getFailedSubmission, clearFailedSubmission, reset, setValue, setError]);

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setServerFieldErrors({});

    // Minimize form and navigate to lessons list immediately
    router.push("/lessons");

    startBackgroundSubmission({
      key: "create_lesson",
      loadingMessage: "Saving lesson...",
      successMessage: "Lesson saved successfully!",
      returnUrl: "/lessons/new",
      formValues: data,
      files: data.resources,
      fieldMapping: {
        subject: "subject_id",
        level: "level_id",
        tags: "tag_id",
        embedded_video_url: "embedded_video_url",
        file: "resources",
        attachments: "resources",
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
          ...(data.tag_id && { tags: [data.tag_id] }),
        };

        const res = await apiFetch<Lesson>("/lessons/", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (data.resources && data.resources.length > 0) {
          for (let i = 0; i < data.resources.length; i++) {
            const formData = new FormData();
            formData.append("file", data.resources[i]);
            await apiFetch(`/lessons/${res.id}/attachments/`, token, {
              method: "POST",
              body: formData,
            });
          }
        }

        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        return res;
      },
      onSuccessUrl: (res) => `/lessons/${res.id}`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />
      
      <Field label="Title (max 100)">
        <input
          {...register("title")}
          className={`${inputClass} ${errors.title ? errorClass : ""}`}
          placeholder="Lesson title"
        />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
      </Field>

      <Field label="Body (max 5000)">
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

      <Field label="Tags">
        <select {...register("tag_id")} className={inputClass}>
          <option value="">Optional…</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Embedded video URL (YouTube / playlist)">
        <input
          type="url"
          {...register("embedded_video_url")}
          className={`${inputClass} ${errors.embedded_video_url ? errorClass : ""}`}
          placeholder="https://www.youtube.com/…"
        />
        {errors.embedded_video_url && <p className="mt-1 text-xs text-danger">{errors.embedded_video_url.message}</p>}
      </Field>

      <Field label="Resources (max 5 · 20MB total · pdf/docx/pptx/zip/images)">
        <FileDropzone 
          onFilesSelected={(files) => {
            setValue("resources", files, { shouldValidate: true });
          }}
          maxFiles={5}
          maxSizeMB={20}
          acceptedTypes={ACCEPTED_FILE_TYPES}
          error={errors.resources?.message as string}
        />
      </Field>

      <Field label="Initial state">
        <select {...register("state")} className={inputClass}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit">
          Save
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href="/lessons/manage" />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
