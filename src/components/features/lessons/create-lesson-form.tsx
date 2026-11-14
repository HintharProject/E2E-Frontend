"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import Link from "next/link";
import { Subject, Level, Tag, Lesson } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm } from "@/lib/form-errors";
import { uploadDirectlyToB2 } from "@/lib/storage";



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
  tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
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
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      body: "",
      subject_id: "",
      level_id: "",
      tags: [],
      embedded_video_url: "",
      state: "DRAFT",
    },
  });

  const searchParams = useSearchParams();

  // Pre-fill subject and level from URL query parameters (e.g., from curriculum triage shortcuts)
  useEffect(() => {
    const rawSubject = searchParams.get("subject") || searchParams.get("subject_id");
    const rawLevel = searchParams.get("level") || searchParams.get("level_id");
    if (rawSubject && subjects.length > 0) {
      const match = subjects.find(
        (s) => s.id === rawSubject || s.code?.toLowerCase() === rawSubject.toLowerCase()
      );
      if (match) {
        setValue("subject_id", match.id, { shouldValidate: true });
      }
    }
    if (rawLevel && levels.length > 0) {
      const match = levels.find(
        (l) => l.id === rawLevel || l.code?.toLowerCase() === rawLevel.toLowerCase()
      );
      if (match) {
        setValue("level_id", match.id, { shouldValidate: true });
      }
    }
  }, [searchParams, subjects, levels, setValue]);

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
        tags: "tags",
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
          tags: data.tags,
        };

        const res = await apiFetch<Lesson>("/lessons/", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (data.resources && data.resources.length > 0) {
          for (let i = 0; i < data.resources.length; i++) {
            const uploaded = await uploadDirectlyToB2(data.resources[i], "lesson_attachment", token);
            await apiFetch(`/lessons/${res.id}/attachments/`, token, {
              method: "POST",
              body: JSON.stringify(uploaded),
            });
          }
        }

        queryClient.setQueryData(["lessons"], (old: any) => {
          if (!old || !old.pages || old.pages.length === 0) return old;
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            data: [res, ...newPages[0].data],
          };
          return { ...old, pages: newPages };
        });

        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        return res;
      },
      onSuccessUrl: (res) => `/lessons/${res.id}`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />
      
      <Field label="Title (max 100)" error={errors.title?.message}>
        <Input
          {...register("title")}
          placeholder="Lesson title"
          aria-invalid={!!errors.title}
        />
      </Field>

      <Field label="Body (max 5000)" error={errors.body?.message}>
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

      <Field label="Embedded video URL (YouTube / playlist)" error={errors.embedded_video_url?.message}>
        <Input
          type="url"
          {...register("embedded_video_url")}
          placeholder="https://www.youtube.com/…"
          aria-invalid={!!errors.embedded_video_url}
        />
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

      <Field label="Initial state" error={errors.state?.message}>
        <Select {...register("state")} aria-invalid={!!errors.state}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </Select>
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
