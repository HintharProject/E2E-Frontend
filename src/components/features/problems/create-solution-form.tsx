"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Solution } from "@/types";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm, extractApiFieldErrors } from "@/lib/form-errors";
import { generateProblemUploadUrl } from "@/hooks/use-problems";
import { Video } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formSchema = z.object({
  body: z.string().min(10, "Solution description must be at least 10 characters").max(5000, "Max 5000 characters"),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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
      "Only .jpg, .png, and .webp formats are supported."
    ),
});

type FormValues = z.infer<typeof formSchema>;

export interface CreateSolutionFormProps {
  problemId: string;
  isLocked?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateSolutionForm({
  problemId,
  isLocked = false,
  onSuccess,
  onCancel,
}: CreateSolutionFormProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const submissionKey = `create_solution_${problemId}`;
  const { getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(
    () => getFailedSubmission(submissionKey)?.serverMessage ?? ""
  );
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>(
    () => getFailedSubmission(submissionKey)?.fieldErrors ?? {}
  );

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
      video_url: "",
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
      if (failed.fieldErrors) {
        applyFieldErrorsToForm(failed.fieldErrors, setError);
      }
      clearFailedSubmission(submissionKey);
    }
  }, [getFailedSubmission, clearFailedSubmission, submissionKey, reset, setValue, setError]);

  if (isLocked) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        This problem thread has been locked by moderation. New solutions cannot be posted.
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError("");
    setServerFieldErrors({});

    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      // Upload solution diagram attachments if any
      const uploadedAttachments: Array<{ file_key: string; file_name: string }> = [];
      if (data.attachments && data.attachments.length > 0) {
        for (const file of Array.from(data.attachments as File[])) {
          const presigned = await generateProblemUploadUrl(
            file.name,
            file.type,
            "solution_attachment",
            token
          );

          const putRes = await fetch(presigned.upload_url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!putRes.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          uploadedAttachments.push({
            file_key: presigned.file_key,
            file_name: file.name,
          });
        }
      }

      const payload = {
        body: data.body.trim(),
        video_url: data.video_url?.trim() || null,
        attachments: uploadedAttachments,
      };

      await apiFetch<Solution>(`/problems/${problemId}/solutions/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["solutions", problemId] });
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      toast.success("Solution posted successfully!");
      reset({ body: "", video_url: "" });
      setValue("attachments", undefined);
      onSuccess?.();
    } catch (err: unknown) {
      const apiErr = err as { code?: string };
      if (apiErr?.code === "THREAD_LOCKED") {
        setServerError("This problem thread has been locked by moderation.");
        toast.error("Thread is locked.");
      } else {
        const { serverMessage, fieldErrors, failedFieldLabels } = extractApiFieldErrors(
          err,
          {
            body: "body",
            video_url: "video_url",
            file: "attachments",
            attachments: "attachments",
          },
          "Failed to post solution."
        );

        setServerError(serverMessage);
        setServerFieldErrors(fieldErrors);
        applyFieldErrorsToForm(fieldErrors, setError);

        const errorLabel =
          failedFieldLabels.length > 0
            ? `Please fix errors in ${failedFieldLabels.join(", ")}`
            : serverMessage;
        toast.error(`Validation failed: ${errorLabel}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="font-heading text-lg font-semibold text-foreground">Submit a Worked Solution</h3>

      <FormErrorBanner serverMessage={serverError} fieldErrors={serverFieldErrors} />

      <Field label="Your Worked Steps & Reasoning" error={errors.body?.message}>
        <Textarea
          {...register("body")}
          className="min-h-36 resize-none"
          placeholder="Explain your step-by-step mathematical working clearly..."
          aria-invalid={!!errors.body}
        />
      </Field>

      <Field label="Video Walkthrough URL (Optional)" error={errors.video_url?.message}>
        <div className="relative">
          <Input
            {...register("video_url")}
            placeholder="e.g. https://www.youtube.com/watch?v=..."
            className="pl-8"
            aria-invalid={!!errors.video_url}
          />
          <Video className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        </div>
      </Field>

      <Field label="Diagrams / Working Photos (Optional · Max 3 · 5MB each)" error={errors.attachments?.message as string | undefined}>
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

      <div className="flex items-center justify-end gap-2.5 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Submitting Solution..." : "Post Solution"}
        </Button>
      </div>
    </form>
  );
}
