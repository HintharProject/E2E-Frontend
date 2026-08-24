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
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { Problem } from "@/types";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm } from "@/lib/form-errors";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
  body: z.string().min(1, "Problem description is required").max(3000, "Max 3000 characters"),
  subject_id: z.string().min(1, "Subject is required"),
  level_id: z.string().min(1, "Level is required"),
  attachments: z
    .any()
    .refine((files) => files && files.length >= 1, "At least 1 image attachment is required.")
    .refine((files) => !files || files.length <= 3, "Max 3 files allowed.")
    .refine(
      (files) => files && Array.from(files as File[]).some((file) => ["image/jpeg", "image/png"].includes(file.type)),
      "At least one attachment must be an image (.jpg or .png)."
    )
    .refine(
      (files) => !files || Array.from(files as File[]).every((file) => file.size <= MAX_FILE_SIZE),
      "Max file size is 5MB per file."
    )
    .refine(
      (files) => !files || Array.from(files as File[]).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only .jpg, .png, and .pdf formats are supported."
    ),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateProblemForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { startBackgroundSubmission, getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

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
    },
  });

  // Recover state and field errors if background creation failed
  useEffect(() => {
    const failed = getFailedSubmission("create_problem");
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
      clearFailedSubmission("create_problem");
    }
  }, [getFailedSubmission, clearFailedSubmission, reset, setValue, setError]);

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setServerFieldErrors({});

    // Minimize form and navigate immediately
    router.push("/problems");

    startBackgroundSubmission({
      key: "create_problem",
      loadingMessage: "Posting problem...",
      successMessage: "Problem posted successfully!",
      returnUrl: "/problems/new",
      formValues: data,
      files: data.attachments,
      fieldMapping: {
        subject: "subject_id",
        level: "level_id",
        uploaded_attachments: "attachments",
        file: "attachments",
        attachments: "attachments",
      },
      router,
      execute: async () => {
        const token = await getToken();
        if (!token) throw new Error("Unauthorized");

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("body", data.body);
        formData.append("subject", data.subject_id);
        formData.append("level", data.level_id);

        if (data.attachments && data.attachments.length > 0) {
          for (let i = 0; i < data.attachments.length; i++) {
            formData.append("uploaded_attachments", data.attachments[i]);
          }
        }

        const res = await apiFetch<Problem>("/problems/", token, {
          method: "POST",
          body: formData,
        });

        queryClient.invalidateQueries({ queryKey: ["problems"] });
        return res;
      },
      onSuccessUrl: (res) => `/problems/${res.id}`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl border border-line bg-card p-6 shadow-sm">
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />
      
      <Field label="Title">
        <input
          {...register("title")}
          className={`${inputClass} ${errors.title ? errorClass : ""}`}
          placeholder="e.g. How to solve this quadratic equation?"
        />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
      </Field>

      <Field label="Description">
        <textarea
          {...register("body")}
          className={`${inputClass} min-h-32 ${errors.body ? errorClass : ""}`}
          placeholder="Describe your problem in detail..."
        />
        {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject *">
          <select {...register("subject_id")} className={`${inputClass} ${errors.subject_id ? errorClass : ""}`}>
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.subject_id && <p className="mt-1 text-xs text-danger">{errors.subject_id.message}</p>}
        </Field>

        <Field label="Level *">
          <select {...register("level_id")} className={`${inputClass} ${errors.level_id ? errorClass : ""}`}>
            <option value="">Select level…</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {errors.level_id && <p className="mt-1 text-xs text-danger">{errors.level_id.message}</p>}
        </Field>
      </div>

      <Field label="Attachments (required · min 1 img · max 3 · 5MB each · jpg/png/pdf)">
        <FileDropzone 
          onFilesSelected={(files) => {
            setValue("attachments", files, { shouldValidate: true });
          }}
          maxFiles={3}
          maxSizeMB={5}
          acceptedTypes={ACCEPTED_FILE_TYPES}
          error={errors.attachments?.message as string}
        />
      </Field>

      <div className="flex gap-3 pt-4 border-t border-line">
        <Button type="submit" className="w-full sm:w-auto">
          Post Problem
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href="/problems" />} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  );
}
