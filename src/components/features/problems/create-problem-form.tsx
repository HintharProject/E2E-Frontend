"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FileDropzone } from "@/components/ui/file-dropzone";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { toast } from "sonner";
import { Problem } from "@/types";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

  const {
    register,
    handleSubmit,
    setValue,
    control,
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

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError("");
    
    try {
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
      toast.success("Problem posted successfully!");
      router.push(`/problems/${res.id}`);
    } catch (err: any) {
      const msg = err.details ? "Validation failed. Please check your inputs." : (err.message || "Failed to post problem.");
      setServerError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl border border-line bg-card p-6 shadow-sm">
      {serverError && <div className="text-danger text-sm font-medium">{serverError}</div>}
      
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
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Posting..." : "Post Problem"}
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href="/problems" />} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  );
}
