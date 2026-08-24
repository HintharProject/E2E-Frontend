"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Solution } from "@/types";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm, extractApiFieldErrors } from "@/lib/form-errors";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf", "application/zip", "application/x-zip-compressed"];

const formSchema = z.object({
  body: z.string().min(1, "Solution description is required").max(5000, "Max 5000 characters"),
  attachments: z
    .any()
    .optional()
    .refine((files) => !files || files.length <= 3, "Max 3 files allowed.")
    .refine(
      (files) => !files || Array.from(files as File[]).every((file) => file.size <= MAX_FILE_SIZE),
      "Max file size is 5MB per file."
    )
    .refine(
      (files) => !files || Array.from(files as File[]).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only .jpg, .png, .pdf, and .zip formats are supported."
    ),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateSolutionForm({ problemId, isSolved }: { problemId: string, isSolved: boolean }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const submissionKey = `create_solution_${problemId}`;
  const { getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
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
      body: "",
    },
  });

  // Recover state and field errors if submission failed
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
    if (isSolved) {
      toast.error("This problem is already solved.");
      return;
    }
    
    setIsSubmitting(true);
    setServerError("");
    setServerFieldErrors({});
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const payload = {
        body: data.body,
      };

      const res = await apiFetch<Solution>(`/problems/${problemId}/solutions/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.attachments && data.attachments.length > 0) {
        for (let i = 0; i < data.attachments.length; i++) {
          const formData = new FormData();
          formData.append("file", data.attachments[i]);
          await apiFetch(`/solutions/${res.id}/attachment/`, token, {
            method: "POST",
            body: formData,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["solutions", problemId] });
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] });
      toast.success("Solution posted successfully!");
      reset({ body: "" });
      setValue("attachments", undefined);
    } catch (err: any) {
      if (err.code === "PROBLEM_SOLVED") {
        setServerError("This problem has already been solved.");
        toast.error("This problem has already been solved.");
      } else if (err.code === "LIMIT_EXCEEDED") {
        setServerError("This problem has reached the maximum number of solutions (5).");
        toast.error("Maximum solutions reached.");
      } else {
        const { serverMessage, fieldErrors, failedFieldLabels } = extractApiFieldErrors(
          err,
          {
            body: "body",
            file: "attachments",
            attachments: "attachments",
          },
          "Failed to post solution."
        );

        setServerError(serverMessage);
        setServerFieldErrors(fieldErrors);
        applyFieldErrorsToForm(fieldErrors, setError);

        const errorLabel = failedFieldLabels.length > 0
          ? `Please fix errors in ${failedFieldLabels.join(", ")}`
          : serverMessage;
        toast.error(`Validation failed: ${errorLabel}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSolved) {
    return (
      <div className="rounded-xl border border-brand/20 bg-brand/5 p-6 text-center text-ink-muted">
        This problem has already been solved. No further solutions can be submitted.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-line bg-card p-6 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-ink">Submit a Solution</h3>
      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />
      
      <Field label="Your Solution">
        <textarea
          {...register("body")}
          className={`${inputClass} min-h-32 ${errors.body ? errorClass : ""}`}
          placeholder="Explain your solution step by step..."
        />
        {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
      </Field>

      <Field label="Attachments (optional · max 3 · 5MB each · jpg/png/pdf/zip)">
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

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Posting..." : "Post Solution"}
        </Button>
      </div>
    </form>
  );
}
