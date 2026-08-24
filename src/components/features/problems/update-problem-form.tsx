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
import { Subject, Level, Problem } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function UpdateProblemForm({
  problem,
  subjects,
  levels,
  writeLocked,
}: {
  problem: Problem;
  subjects: Subject[];
  levels: Level[];
  writeLocked: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const formSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
    body: z.string().min(1, "Problem description is required").max(3000, "Max 3000 characters"),
    subject_id: z.string().min(1, "Subject is required"),
    level_id: z.string().min(1, "Level is required"),
    attachment: z
      .any()
      .optional()
      .refine((files) => !files || files.length === 0 || files.length <= 1, "Max 1 file upload per update.")
      .refine(
        (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
        "Max file size is 5MB."
      )
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
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: problem.title,
      body: problem.body,
      subject_id: problem.subject ?? "",
      level_id: problem.level ?? "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Navigate away immediately
    router.push("/problems");

    const promise = (async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const payload = {
        title: data.title,
        body: data.body,
        subject: data.subject_id,
        level: data.level_id,
      };

      const res = await apiFetch(`/problems/${problem.id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (data.attachment && data.attachment.length > 0) {
        const formData = new FormData();
        formData.append("file", data.attachment[0]);
        await apiFetch(`/problems/${problem.id}/attachment/`, token, {
          method: "POST",
          body: formData,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["problem", problem.id] });
      return res;
    })();

    const toastId = toast.loading("Saving changes...");

    promise
      .then(() => {
        router.refresh();
        toast.success("Changes saved successfully!", {
          id: toastId,
          action: {
            label: "View",
            onClick: () => router.push(`/problems/${problem.id}`),
          },
        });
      })
      .catch((err: any) => {
        const msg = err.details ? "Validation failed" : (err.message || "Something went wrong");
        toast.error(`Failed to save: ${msg}`, {
          id: toastId,
          action: {
            label: "Retry",
            onClick: () => router.push(`/problems/${problem.id}/edit`),
          },
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      {serverError && <div className="text-danger text-sm">{serverError}</div>}
      
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

      <Field label="Add new attachment (optional · max 1 per upload · 5MB · jpg/png/pdf)">
        <FileDropzone 
          onFilesSelected={(files) => {
            setValue("attachment", files, { shouldValidate: true });
          }}
          maxFiles={1}
          maxSizeMB={5}
          acceptedTypes={ACCEPTED_FILE_TYPES}
          error={errors.attachment?.message as string}
        />
        {problem.attachments && problem.attachments.length > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Current attachments: {problem.attachments.length}. Uploading a new one will add to the list.
          </p>
        )}
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={writeLocked || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href={`/problems/${problem.id}`} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
