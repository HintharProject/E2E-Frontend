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
import { Solution } from "@/types";
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
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf", "application/zip", "application/x-zip-compressed"];

export function UpdateSolutionForm({
  solution,
  problemId,
  writeLocked,
}: {
  solution: Solution;
  problemId: string;
  writeLocked: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const submissionKey = `update_solution_${solution.id}`;
  const { startBackgroundSubmission, getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});
  const [existingAttachments, setExistingAttachments] = useState(solution.attachments || []);

  const handleRemoveExistingAttachment = async (attachmentId: string) => {
    const toastId = toast.loading("Removing attachment...");
    try {
      const token = await getToken();
      await apiFetch(`/solutions/${solution.id}/attachment/${attachmentId}/`, token, {
        method: "DELETE",
      });
      setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
      toast.success("Attachment removed", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["solution", solution.id] });
      queryClient.invalidateQueries({ queryKey: ["solutions", problemId] });
    } catch (err: any) {
      toast.error("Failed to remove attachment", { id: toastId });
    }
  };

  const formSchema = z.object({
    body: z.string().min(1, "Solution description is required").max(5000, "Max 5000 characters"),
    attachments: z
      .any()
      .optional()
      .refine((files) => !files || files.length === 0 || files.length <= 1, "Max 1 file upload per update.")
      .refine(
        (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
        "Max file size is 5MB."
      )
      .refine(
        (files) => !files || files.length === 0 || ACCEPTED_FILE_TYPES.includes(files[0].type),
        "Only .jpg, .png, .pdf, and .zip formats are supported."
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
      body: solution.body,
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
    router.push(`/problems/${problemId}`);

    startBackgroundSubmission({
      key: submissionKey,
      loadingMessage: "Saving changes...",
      successMessage: "Changes saved successfully!",
      returnUrl: `/problems/${problemId}/solutions/${solution.id}/edit`,
      formValues: data,
      files: data.attachments,
      fieldMapping: {
        file: "attachments",
        attachments: "attachments",
        uploaded_attachments: "attachments",
      },
      router,
      execute: async () => {
        const token = await getToken();
        if (!token) throw new Error("Unauthorized");

        const payload = {
          body: data.body,
        };

        const res = await apiFetch<Solution>(`/solutions/${solution.id}/`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (data.attachments && data.attachments.length > 0) {
          const formData = new FormData();
          formData.append("file", data.attachments[0]);
          await apiFetch(`/solutions/${solution.id}/attachment/`, token, {
            method: "POST",
            body: formData,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["solutions", problemId] });
        queryClient.invalidateQueries({ queryKey: ["solution", solution.id] });
        return res;
      },
      onSuccessUrl: () => `/problems/${problemId}`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />
      
      <Field label="Solution">
        <textarea
          {...register("body")}
          className={`${inputClass} min-h-32 ${errors.body ? errorClass : ""}`}
        />
        {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
      </Field>

      <Field label="New attachment (optional · max 1 · 5MB · jpg/png/pdf/zip)">
        {existingAttachments.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Existing attachments:</p>
            <ul className="flex flex-col gap-2">
              {existingAttachments.map(att => (
                <li key={att.id} className="flex items-center justify-between p-2 text-sm border border-line rounded-md bg-secondary">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="truncate flex-1 min-w-0 font-medium">{att.file_name || (att as any).attachment_name || "Attachment"}</span>
                  </div>
                  <Button type="button" variant="ghost" size="xs" onClick={() => handleRemoveExistingAttachment(att.id)} className="shrink-0 text-ink-muted hover:text-danger">
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <FileDropzone 
          onFilesSelected={(files) => {
            setValue("attachments", files, { shouldValidate: true });
          }}
          maxFiles={1}
          maxSizeMB={5}
          acceptedTypes={ACCEPTED_FILE_TYPES}
          error={errors.attachments?.message as string}
        />
        {solution.attachments && solution.attachments.length > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Current attachments: {solution.attachments.length}. Uploading a new one will add to the list.
          </p>
        )}
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={writeLocked}>
          Save Changes
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href={`/problems/${problemId}`} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
