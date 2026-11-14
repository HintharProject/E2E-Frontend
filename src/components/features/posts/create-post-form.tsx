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
import Link from "next/link";
import { Post } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm } from "@/lib/form-errors";
import { uploadDirectlyToB2 } from "@/lib/storage";



const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function CreatePostForm({
  userRole,
  writeLocked,
}: {
  userRole: string;
  writeLocked: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { startBackgroundSubmission, getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

  const canAnnounce = userRole === "ADMIN" || userRole === "SUPERADMIN";
  const subjectRequired = userRole === "USER" || userRole === "MODERATOR";

  const formSchema = z.object({
    post_type: z.enum(["QUESTION", "SHARING", "ANNOUNCEMENT"]),
    title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
    body: z.string().min(1, "Body is required").max(3000, "Max 3000 characters"),
    subject_id: subjectRequired ? z.string().min(1, "Subject is required") : z.string().optional().or(z.literal("")),
    level_id: subjectRequired ? z.string().min(1, "Level is required") : z.string().optional().or(z.literal("")),
    tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
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
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      post_type: "QUESTION",
      title: "",
      body: "",
      subject_id: "",
      level_id: "",
      tags: [],
    },
  });

  // Recover state and field errors if background submission failed
  useEffect(() => {
    const failed = getFailedSubmission("create_post");
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
      clearFailedSubmission("create_post");
    }
  }, [getFailedSubmission, clearFailedSubmission, reset, setValue, setError]);

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setServerFieldErrors({});

    // Minimize form and navigate to forum immediately
    router.push("/forum");

    startBackgroundSubmission({
      key: "create_post",
      loadingMessage: "Publishing post...",
      successMessage: "Post published successfully!",
      returnUrl: "/posts/new",
      formValues: data,
      files: data.attachment,
      fieldMapping: {
        subject: "subject_id",
        level: "level_id",
        tags: "tags",
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
          tags: data.tags,
        };

        const res = await apiFetch<Post>("/posts/", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (data.attachment && data.attachment.length > 0) {
          const uploaded = await uploadDirectlyToB2(data.attachment[0], "post_attachment", token);
          await apiFetch(`/posts/${res.id}/attachment/`, token, {
            method: "POST",
            body: JSON.stringify(uploaded),
          });
        }

        queryClient.setQueryData(["posts"], (old: any) => {
          if (!old || !old.pages || old.pages.length === 0) return old;
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            data: [res, ...newPages[0].data],
          };
          return { ...old, pages: newPages };
        });

        queryClient.invalidateQueries({ queryKey: ["posts"] });
        return res;
      },
      onSuccessUrl: (res) => `/posts/${res.id}`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />
      
      <Field label="Post type" error={errors.post_type?.message}>
        <Select {...register("post_type")} aria-invalid={!!errors.post_type}>
          <option value="QUESTION">Question</option>
          <option value="SHARING">Sharing</option>
          {canAnnounce && <option value="ANNOUNCEMENT">Announcement</option>}
        </Select>
      </Field>

      <Field label="Title (max 100)" error={errors.title?.message}>
        <Input
          {...register("title")}
          placeholder="Clear, searchable title"
          aria-invalid={!!errors.title}
        />
      </Field>

      <Field label="Body (max 3000)" error={errors.body?.message}>
        <Textarea
          {...register("body")}
          placeholder="What's on your mind?"
          aria-invalid={!!errors.body}
          className="min-h-32"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Subject${subjectRequired ? " *" : " (optional)"}`} error={errors.subject_id?.message}>
          <Select {...register("subject_id")} aria-invalid={!!errors.subject_id}>
            <option value="">Select…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>

        <Field label={`Level${subjectRequired ? " *" : " (optional)"}`} error={errors.level_id?.message}>
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

      <Field label="Attachment (optional · max 1 · 5MB · jpg/png/pdf)">
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
          Publish
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href="/forum" />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
