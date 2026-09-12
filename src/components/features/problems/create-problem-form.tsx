"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

import { FileDropzone } from "@/components/ui/file-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { Problem, Resource } from "@/types";
import { useFormSubmissionStore } from "@/lib/store/form-submission-store";
import { applyFieldErrorsToForm } from "@/lib/form-errors";
import { inspectImageGeometry } from "./canvas-geometry-inspector";
import { PreCreationPreviewDrawer } from "./pre-creation-preview-drawer";
import { useProblemByPaper, generateProblemUploadUrl } from "@/hooks/use-problems";
import { Camera, FileText, BookOpen, AlertCircle, Check, FolderOpen, X } from "lucide-react";
import { toast } from "sonner";
import { PastPaperSelectorModal } from "./past-paper-selector-modal";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

const PathASchema = z.object({
  origin: z.literal("USER_UPLOAD"),
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Max 150 characters"),
  body: z.string().min(10, "Problem description must be at least 10 characters").max(3000, "Max 3000 characters"),
  subject_id: z.string().min(1, "Please select a subject"),
  level_id: z.string().min(1, "Please select an education level"),
  source: z.string().max(100).optional(),
  attachments: z
    .any()
    .refine((files) => files && files.length >= 1, "At least 1 image attachment is required.")
    .refine((files) => !files || files.length <= 3, "Max 3 files allowed."),
});

const PathBSchema = z.object({
  origin: z.literal("PAST_PAPER"),
  level_id: z.string().min(1, "Please select an education level"),
  subject_id: z.string().min(1, "Please select a subject"),
  resource_id: z.string().min(1, "Please select a curated past paper"),
  question_number: z.string().min(1, "Question number is required").max(50, "Max 50 characters"),
  title: z.string().max(150, "Max 150 characters").optional(),
  body: z.string().max(3000, "Max 3000 characters").optional(),
});

const formSchema = z.discriminatedUnion("origin", [PathASchema, PathBSchema]);

type FormValues = z.infer<typeof formSchema>;

export interface CreateProblemFormProps {
  initialOrigin?: "USER_UPLOAD" | "PAST_PAPER";
  initialResourceId?: string;
  initialQuestionNumber?: string;
}

export function CreateProblemForm({
  initialOrigin,
  initialResourceId,
  initialQuestionNumber,
}: CreateProblemFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { startBackgroundSubmission, getFailedSubmission, clearFailedSubmission } = useFormSubmissionStore();

  const urlOrigin = (searchParams.get("origin") as "USER_UPLOAD" | "PAST_PAPER") || initialOrigin || "USER_UPLOAD";
  const [selectedOrigin, setSelectedOrigin] = useState<"USER_UPLOAD" | "PAST_PAPER">(urlOrigin);
  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});
  const [imageGeometryError, setImageGeometryError] = useState("");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);

  const [selectedPaper, setSelectedPaper] = useState<Resource | null>(null);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: selectedOrigin,
      title: "",
      body: "",
      subject_id: "",
      level_id: "",
      source: "",
      resource_id: initialResourceId || "",
      question_number: initialQuestionNumber || "",
    } as any,
  });

  const watchedResourceId = watch("resource_id" as any);
  const watchedQuestionNumber = watch("question_number" as any);
  const watchedLevelId = watch("level_id" as any);
  const watchedSubjectId = watch("subject_id" as any);

  // Fetch individual resource details when a resource is selected or initialized
  const { data: fetchedSelectedResource } = useQuery<Resource | null>({
    queryKey: ["resourceDetail", watchedResourceId],
    queryFn: async () => {
      if (!watchedResourceId) return null;
      const token = await getToken();
      const res = await apiFetch<any>(`/resources/files/${watchedResourceId}/`, token);
      return res;
    },
    enabled: !!watchedResourceId,
  });

  // Selected Resource entity for taxonomy inheritance and display
  const selectedResource = useMemo(() => {
    if (!watchedResourceId) return null;
    if (selectedPaper && selectedPaper.id === watchedResourceId) return selectedPaper;
    if (fetchedSelectedResource && fetchedSelectedResource.id === watchedResourceId) return fetchedSelectedResource;
    return null;
  }, [watchedResourceId, selectedPaper, fetchedSelectedResource]);

  // If fetched resource loads (e.g. from initialResourceId or restored form), populate taxonomy
  useEffect(() => {
    if (fetchedSelectedResource && fetchedSelectedResource.id === watchedResourceId) {
      const resLvl =
        fetchedSelectedResource.level_details?.id ||
        (typeof fetchedSelectedResource.level === "string"
          ? fetchedSelectedResource.level
          : (fetchedSelectedResource.level as any)?.id);
      const resSub =
        fetchedSelectedResource.subject_details?.id ||
        (typeof fetchedSelectedResource.subject === "string"
          ? fetchedSelectedResource.subject
          : (fetchedSelectedResource.subject as any)?.id);

      if (resLvl && !watchedLevelId) {
        setValue("level_id" as any, resLvl, { shouldValidate: true });
      }
      if (resSub && !watchedSubjectId) {
        setValue("subject_id" as any, resSub, { shouldValidate: true });
      }
    }
  }, [fetchedSelectedResource, watchedResourceId, setValue, watchedLevelId, watchedSubjectId]);

  // Invalidate paper if user changes level or subject to an incompatible value in Path B
  useEffect(() => {
    if (selectedOrigin === "PAST_PAPER" && selectedResource) {
      const resLvl =
        selectedResource.level_details?.id ||
        (typeof selectedResource.level === "string"
          ? selectedResource.level
          : (selectedResource.level as any)?.id);
      const resSub =
        selectedResource.subject_details?.id ||
        (typeof selectedResource.subject === "string"
          ? selectedResource.subject
          : (selectedResource.subject as any)?.id);

      if (
        (resLvl && watchedLevelId && resLvl !== watchedLevelId) ||
        (resSub && watchedSubjectId && resSub !== watchedSubjectId)
      ) {
        setValue("resource_id" as any, "", { shouldValidate: true });
        setSelectedPaper(null);
      }
    }
  }, [selectedOrigin, selectedResource, watchedLevelId, watchedSubjectId, setValue]);

  const handleOpenPaperModal = () => {
    let hasError = false;
    if (!watchedLevelId) {
      setError("level_id" as any, { type: "manual", message: "Please select an education level first." });
      hasError = true;
    }
    if (!watchedSubjectId) {
      setError("subject_id" as any, { type: "manual", message: "Please select a subject first." });
      hasError = true;
    }

    if (hasError) {
      toast.error("Please select both Level and Subject to choose a paper.");
      return;
    }

    setIsPaperModalOpen(true);
  };

  const formatSession = (s?: string) => {
    if (s === "MAY_JUNE") return "May / June";
    if (s === "OCT_NOV") return "Oct / Nov";
    if (s === "JANUARY") return "January";
    return s || "";
  };

  // Debounced Deduplication Check for Path B
  const [debouncedQuestion, setDebouncedQuestion] = useState(watchedQuestionNumber || "");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuestion(watchedQuestionNumber || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedQuestionNumber]);

  const { data: dedupData } = useProblemByPaper(
    selectedOrigin === "PAST_PAPER" ? watchedResourceId : undefined,
    selectedOrigin === "PAST_PAPER" ? debouncedQuestion : undefined
  );

  // Automatically open preview drawer when existing canonical problem is found
  useEffect(() => {
    if (selectedOrigin === "PAST_PAPER" && dedupData?.exists && dedupData.problem) {
      setPreviewDrawerOpen(true);
    }
  }, [selectedOrigin, dedupData]);

  // Recover state if background submission failed
  useEffect(() => {
    const failed = getFailedSubmission("create_problem");
    if (failed) {
      if (failed.formValues) {
        reset(failed.formValues as FormValues);
        if (failed.formValues.origin) {
          setSelectedOrigin(failed.formValues.origin);
        }
      }
      if (failed.files && failed.files.length > 0) {
        setStagedFiles(failed.files);
        setValue("attachments" as any, failed.files, { shouldValidate: true });
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

  const handleOriginChange = (newOrigin: "USER_UPLOAD" | "PAST_PAPER") => {
    setSelectedOrigin(newOrigin);
    setValue("origin", newOrigin as any);
    setServerError("");
    setServerFieldErrors({});
    setImageGeometryError("");
  };

  // Inspect image files via CanvasGeometryInspector on selection
  const handleFilesSelected = async (files: File[]) => {
    setImageGeometryError("");
    const inspected: File[] = [];

    for (const f of files) {
      const result = await inspectImageGeometry(f);
      if (!result.isValid) {
        setImageGeometryError(result.error || `Invalid image: ${f.name}`);
        toast.error(result.error || `Invalid image: ${f.name}`);
        return;
      }
      inspected.push(result.file);
    }

    setStagedFiles(inspected);
    setValue("attachments" as any, inspected, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setServerFieldErrors({});

    // Minimize form and navigate immediately to /problems
    router.push("/problems");

    startBackgroundSubmission({
      key: "create_problem",
      loadingMessage: "Posting problem...",
      successMessage: "Problem posted successfully!",
      returnUrl: "/problems/new",
      formValues: data,
      files: data.origin === "USER_UPLOAD" ? stagedFiles : undefined,
      fieldMapping: {
        subject: "subject_id",
        level: "level_id",
        resource: "resource_id",
        question: "question_number",
        uploaded_attachments: "attachments",
        file: "attachments",
        attachments: "attachments",
      },
      router,
      execute: async () => {
        const token = await getToken();
        if (!token) throw new Error("Unauthorized");

        if (data.origin === "USER_UPLOAD") {
          // Step 1: Upload images directly to Backblaze B2 via presigned URLs
          const uploadedAttachments: Array<{ file_key: string; file_name: string }> = [];

          for (const file of stagedFiles) {
            const presigned = await generateProblemUploadUrl(
              file.name,
              file.type,
              "problem_attachment",
              token
            );

            // Execute browser-direct binary PUT to Backblaze B2
            const putRes = await fetch(presigned.upload_url, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            });

            if (!putRes.ok) {
              throw new Error(`Failed to upload ${file.name} to storage bucket.`);
            }

            uploadedAttachments.push({
              file_key: presigned.file_key,
              file_name: file.name,
            });
          }

          // Step 2: Post Problem payload to backend
          const payload = {
            origin: "USER_UPLOAD",
            title: data.title,
            body: data.body,
            subject: data.subject_id,
            level: data.level_id,
            source: data.source?.trim() || "others",
            uploaded_attachments: uploadedAttachments,
          };

          const res = await apiFetch<Problem>("/problems/", token, {
            method: "POST",
            body: JSON.stringify(payload),
          });

          queryClient.invalidateQueries({ queryKey: ["problems"] });
          return res;
        } else {
          // Path B: Curated Past Paper
          const payload = {
            origin: "PAST_PAPER",
            resource: data.resource_id,
            question_number: data.question_number.trim(),
            title: data.title?.trim() || "",
            body: data.body?.trim() || "",
            is_feed_visible: true,
            uploaded_attachments: [],
          };

          const res = await apiFetch<Problem>("/problems/", token, {
            method: "POST",
            body: JSON.stringify(payload),
          });

          queryClient.invalidateQueries({ queryKey: ["problems"] });
          return res;
        }
      },
      onSuccessUrl: (res: any) => `/problems/${res.id}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Selector: Path A vs Path B */}
      <div className="flex rounded-xl border border-line bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => handleOriginChange("USER_UPLOAD")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedOrigin === "USER_UPLOAD"
              ? "bg-card text-brand shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Camera className="size-4" />
          <span>Manual Photo Upload (Path A)</span>
        </button>

        <button
          type="button"
          onClick={() => handleOriginChange("PAST_PAPER")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedOrigin === "PAST_PAPER"
              ? "bg-card text-brand shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <BookOpen className="size-4" />
          <span>Curated Past Paper (Path B)</span>
        </button>
      </div>

      <FormErrorBanner
        serverMessage={serverError}
        fieldErrors={serverFieldErrors}
      />

      {imageGeometryError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-600 flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{imageGeometryError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register("origin")} value={selectedOrigin} />

        {/* Path A Workflow */}
        {selectedOrigin === "USER_UPLOAD" && (
          <>
            <Field label="Problem Title">
              <input
                {...register("title")}
                placeholder="e.g. Stuck on trigonometric identity verification"
                className={`${inputClass} ${errors.title ? errorClass : ""}`}
              />
              {errors.title && <p className="mt-1 text-xs text-danger font-normal">{errors.title.message}</p>}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Subject">
                <select
                  {...register("subject_id" as any)}
                  className={`${inputClass} ${(errors as any).subject_id ? errorClass : ""}`}
                >
                  <option value="">Select subject...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {(errors as any).subject_id && (
                  <p className="mt-1 text-xs text-danger font-normal">{(errors as any).subject_id.message}</p>
                )}
              </Field>

              <Field label="Level">
                <select
                  {...register("level_id" as any)}
                  className={`${inputClass} ${(errors as any).level_id ? errorClass : ""}`}
                >
                  <option value="">Select level...</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
                {(errors as any).level_id && (
                  <p className="mt-1 text-xs text-danger font-normal">{(errors as any).level_id.message}</p>
                )}
              </Field>
            </div>

            <Field label="Source / Reference (Optional)">
              <input
                {...register("source" as any)}
                placeholder="e.g. Oxford Pure Maths Ex 7B or Cambridge 9709 Homework"
                className={inputClass}
              />
              {(errors as any).source && (
                <p className="mt-1 text-xs text-danger font-normal">{(errors as any).source.message}</p>
              )}
            </Field>

            <Field label="Problem Description / Working">
              <textarea
                {...register("body")}
                rows={5}
                placeholder="Describe your current steps, where you are stuck, or what you've tried so far..."
                className={`${inputClass} resize-none ${errors.body ? errorClass : ""}`}
              />
              {errors.body && <p className="mt-1 text-xs text-danger font-normal">{errors.body.message}</p>}
            </Field>

            <Field label="Question Photos (1 to 3 images)">
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                maxFiles={3}
                maxSizeMB={5}
                acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
                error={(errors as any).attachments?.message as string}
              />
              {(errors as any).attachments && (
                <p className="mt-1 text-xs text-danger font-normal">{(errors as any).attachments.message}</p>
              )}
              <p className="mt-1.5 text-xs text-ink-muted font-normal lowercase first-letter:uppercase">
                Images are inspected for minimum 200px resolution and aspect ratio before upload. High-resolution phone photos will be automatically optimized to WebP.
              </p>
            </Field>
          </>
        )}

        {/* Path B Workflow */}
        {selectedOrigin === "PAST_PAPER" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Education Level">
                <select
                  {...register("level_id" as any)}
                  className={`${inputClass} ${(errors as any).level_id ? errorClass : ""}`}
                >
                  <option value="">Select level...</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
                {(errors as any).level_id && (
                  <p className="mt-1 text-xs text-danger font-normal">{(errors as any).level_id.message}</p>
                )}
              </Field>

              <Field label="Subject">
                <select
                  {...register("subject_id" as any)}
                  className={`${inputClass} ${(errors as any).subject_id ? errorClass : ""}`}
                >
                  <option value="">Select subject...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {(errors as any).subject_id && (
                  <p className="mt-1 text-xs text-danger font-normal">{(errors as any).subject_id.message}</p>
                )}
              </Field>
            </div>

            <Field label="Curated Exam Paper">
              <input type="hidden" {...register("resource_id" as any)} />

              {!selectedResource ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-dashed border-line bg-surface/40">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenPaperModal}
                      className="h-9 px-4 gap-2 font-semibold text-xs border-line hover:border-brand hover:text-brand transition-colors shrink-0"
                    >
                      <FolderOpen className="size-4 text-brand" />
                      <span>Select a Paper</span>
                    </Button>
                    <span className="text-xs text-ink-muted">
                      Requires Level and Subject above to be selected first.
                    </span>
                  </div>
                  {(errors as any).resource_id && (
                    <p className="text-xs text-danger font-normal">{(errors as any).resource_id.message}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-card p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
                        <DocTypeIcon
                          filename={selectedResource.file_name || selectedResource.title || ""}
                          resourceType={selectedResource.resource_type}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="font-semibold text-ink text-xs sm:text-sm truncate"
                          title={selectedResource.title || selectedResource.file_name}
                        >
                          {selectedResource.title || selectedResource.file_name || "Past Paper"}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {selectedResource.session && (
                            <span className="inline-flex items-center text-[11px] font-medium text-ink-muted bg-surface border border-line px-2 py-0.5 rounded-md">
                              {formatSession(selectedResource.session)}
                            </span>
                          )}
                          {selectedResource.paper_type && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-semibold ${
                                selectedResource.paper_type === "QP"
                                  ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                                  : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                              }`}
                            >
                              {selectedResource.paper_type === "QP" ? "Question Paper" : "Mark Scheme"}
                            </Badge>
                          )}
                          {selectedResource.year && (
                            <Badge variant="secondary" className="text-[10px]">
                              {selectedResource.year}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenPaperModal}
                        className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                      >
                        <FolderOpen className="size-3.5" />
                        <span>Change Paper</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setValue("resource_id" as any, "", { shouldValidate: true });
                          setSelectedPaper(null);
                        }}
                        className="h-8 px-2 text-xs text-ink-muted hover:text-danger hover:bg-danger/10"
                        title="Remove paper"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Field>

            <Field label="Question Number">
              <input
                {...register("question_number" as any)}
                placeholder="e.g. Q4(b) or Question 3"
                className={`${inputClass} ${(errors as any).question_number ? errorClass : ""}`}
              />
              {(errors as any).question_number && (
                <p className="mt-1 text-xs text-danger font-normal">{(errors as any).question_number.message}</p>
              )}
            </Field>

            <Field label="Custom Title (Optional)">
              <input
                {...register("title")}
                placeholder={
                  selectedResource
                    ? `${selectedResource.title || selectedResource.file_name} — ${watchedQuestionNumber || "Question"}`
                    : "Auto-derived canonical title"
                }
                className={inputClass}
              />
              {errors.title && <p className="mt-1 text-xs text-danger font-normal">{errors.title.message}</p>}
            </Field>

            <Field label="Question / Working Notes (Optional)">
              <textarea
                {...register("body")}
                rows={4}
                placeholder="Add any specific context or question about this past-paper problem..."
                className={`${inputClass} resize-none`}
              />
              {errors.body && <p className="mt-1 text-xs text-danger font-normal">{errors.body.message}</p>}
            </Field>

            {/* Informational Banner replacing Image Dropzone */}
            <div className="rounded-xl border border-dashed border-line bg-muted/30 p-4 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
              <Check className="size-4 text-emerald-500" />
              <span>
                This question references the platform-curated exam paper directly. No image upload is needed.
              </span>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <Link href="/problems" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
          <Button type="submit">
            Post Problem
          </Button>
        </div>
      </form>


      {/* Instant Solution Preview Drawer for Path B */}
      {selectedOrigin === "PAST_PAPER" && dedupData?.problem && (
        <PreCreationPreviewDrawer
          isOpen={previewDrawerOpen}
          onClose={() => setPreviewDrawerOpen(false)}
          resourceTitle={selectedResource?.title || selectedResource?.file_name || "Past Paper"}
          questionNumber={watchedQuestionNumber || ""}
          existingProblem={dedupData.problem}
          existingSolutions={dedupData.solutions || []}
          onPromoteToPublic={() => {
            setPreviewDrawerOpen(false);
          }}
        />
      )}

      {/* Past Paper Selector Modal */}
      <PastPaperSelectorModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        levelId={watchedLevelId}
        subjectId={watchedSubjectId}
        levelName={levels.find((l) => l.id === watchedLevelId)?.name}
        subjectName={subjects.find((s) => s.id === watchedSubjectId)?.name}
        selectedPaperId={watchedResourceId}
        onSelectPaper={(paper) => {
          setSelectedPaper(paper);
          setValue("resource_id" as any, paper.id, { shouldValidate: true });
          clearErrors("resource_id" as any);
        }}
      />
    </div>
  );
}
