"use client";

import { useState, useEffect, useMemo, useRef, useId, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { Input } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { MarkdownMathEditor } from "@/components/ui/markdown-math-editor";
import { Badge } from "@/components/ui/badge";
import {
  ArchivalComposerShell,
  ArchivalTitleInput,
} from "@/components/features/editor/archival-composer-shell";
import {
  MetadataPillBar,
  MetadataSelectPill,
  MetadataTogglePill,
} from "@/components/features/editor/metadata-pill-bar";
import { BlockDocumentEditor } from "@/components/features/editor/block-document-editor";
import { MediaDock } from "@/components/features/editor/media-dock";
import { useEditorMediaItems } from "@/components/features/editor/use-editor-media-items";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { Problem, Resource } from "@/types";
import { applyFieldErrorsToForm, extractApiFieldErrors } from "@/lib/form-errors";
import { useStagedUploads } from "@/hooks/use-staged-uploads";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { appendInlineImageToBody } from "@/lib/inline-media";
import { UPLOAD_SCOPE_RULES } from "@/lib/upload-rules";
import { PreCreationPreviewDrawer } from "./pre-creation-preview-drawer";
import { PastPaperSelectorModal } from "./past-paper-selector-modal";
import { useProblemByPaper } from "@/hooks/use-problems";
import {
  Camera,
  BookOpen,
  Check,
  FolderOpen,
  X,
  Eye,
  Tag as TagIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";
import { cn } from "@/lib/utils";

const PROBLEM_RULE = UPLOAD_SCOPE_RULES.problem_attachment;

const PathASchema = z.object({
  origin: z.literal("USER_UPLOAD"),
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Max 150 characters"),
  body: z
    .string()
    .trim()
    .min(10, "Problem description must be at least 10 characters")
    .max(3000, "Max 3000 characters"),
  subject_id: z.string().min(1, "Please select a subject"),
  level_id: z.string().min(1, "Please select an education level"),
  tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
  source: z.string().max(100).optional(),
  resource_id: z.string().optional(),
  question_number: z.string().optional(),
  attachments: z
    .any()
    .refine(
      (files) => Array.isArray(files) && files.length >= 1,
      "At least 1 image attachment is required."
    )
    .refine(
      (files) => !files || (Array.isArray(files) && files.length <= 3),
      "Max 3 files allowed."
    ),
});

const PathBSchema = z.object({
  origin: z.literal("PAST_PAPER"),
  level_id: z.string().min(1, "Please select an education level"),
  subject_id: z.string().min(1, "Please select a subject"),
  resource_id: z.string().min(1, "Please select a curated past paper"),
  question_number: z
    .string()
    .trim()
    .min(1, "Question number is required")
    .max(50, "Max 50 characters"),
  title: z.string().max(150, "Max 150 characters").optional(),
  body: z.string().max(3000, "Max 3000 characters").optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
  attachments: z.any().optional(),
});

const formSchema = z.discriminatedUnion("origin", [PathASchema, PathBSchema]);

type FormValues = z.infer<typeof formSchema>;

interface ProblemDraft extends Record<string, unknown> {
  origin: "USER_UPLOAD" | "PAST_PAPER";
  title: string;
  body: string;
  subject_id: string;
  level_id: string;
  source: string;
  resource_id: string;
  question_number: string;
  tags: string[];
  selectedPaper: Resource | null;
  hadAttachments: boolean;
}

export interface CreateProblemFormProps {
  initialOrigin?: "USER_UPLOAD" | "PAST_PAPER";
  initialResourceId?: string;
  initialQuestionNumber?: string;
}

function getResourceTaxonomyId(
  detailsObj: { id?: string } | undefined,
  rawField: string | { id?: string } | undefined
): string {
  if (detailsObj?.id) return detailsObj.id;
  if (typeof rawField === "string") return rawField;
  if (rawField && typeof rawField === "object" && rawField.id) return rawField.id;
  return "";
}

function isProblemDraftEmpty(draft: Partial<ProblemDraft>): boolean {
  return (
    !draft.title?.trim() &&
    !draft.body?.trim() &&
    !draft.source?.trim() &&
    !draft.resource_id?.trim() &&
    !draft.question_number?.trim() &&
    (!draft.tags || draft.tags.length === 0) &&
    !draft.selectedPaper &&
    !draft.hadAttachments
  );
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

  const uid = useId();
  const titleId = `${uid}-problem-title`;
  const subjectIdA = `${uid}-problem-subject-a`;
  const levelIdA = `${uid}-problem-level-a`;
  const sourceIdA = `${uid}-problem-source`;
  const bodyIdA = `${uid}-problem-body-a`;
  const subjectIdB = `${uid}-problem-subject-b`;
  const levelIdB = `${uid}-problem-level-b`;
  const qNumIdB = `${uid}-problem-qnum`;
  const titleIdB = `${uid}-problem-title-b`;
  const bodyIdB = `${uid}-problem-body-b`;

  const errorBannerRef = useRef<HTMLDivElement>(null);
  const pathATabRef = useRef<HTMLButtonElement>(null);
  const pathBTabRef = useRef<HTMLButtonElement>(null);
  const appliedDraftRef = useRef(false);

  const urlResource =
    searchParams.get("resource") ||
    searchParams.get("resource_id") ||
    initialResourceId ||
    "";
  const urlLevel =
    searchParams.get("level") || searchParams.get("level_id") || "";
  const urlSubject =
    searchParams.get("subject") || searchParams.get("subject_id") || "";
  const urlQuestionNumber =
    searchParams.get("question") ||
    searchParams.get("question_number") ||
    initialQuestionNumber ||
    "";
  const urlOrigin =
    (urlResource || searchParams.get("origin") === "PAST_PAPER"
      ? "PAST_PAPER"
      : (searchParams.get("origin") as "USER_UPLOAD" | "PAST_PAPER" | null)) ||
    initialOrigin ||
    "USER_UPLOAD";

  const [mode, setMode] = useState<"write" | "preview">("write");
  const [showSourceWell, setShowSourceWell] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<
    "USER_UPLOAD" | "PAST_PAPER"
  >(urlOrigin);
  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Resource | null>(null);
  const [errorFocusTick, setErrorFocusTick] = useState(0);
  const [prevUrlResource, setPrevUrlResource] = useState(urlResource);

  if (urlResource !== prevUrlResource) {
    setPrevUrlResource(urlResource);
    if (urlResource) {
      setSelectedOrigin("PAST_PAPER");
    }
  }

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

  const {
    items,
    batchError,
    isUploading,
    isOptimizing,
    addFiles,
    removeFile,
    cancelUpload,
    uploadAll,
    retryItem,
    reset: resetUploads,
  } = useStagedUploads({
    scope: "problem_attachment",
    optimizeImages: true,
  });

  const mediaItems = useEditorMediaItems(items);

  const {
    restoredDraft,
    hasRestoredDraft,
    saveDraft,
    clearDraft,
    dismissRestoredNotice,
  } = useDraftPersistence<ProblemDraft>({
    storageKey: "draft:problem:new",
    isEmpty: isProblemDraftEmpty,
  });

  const [prevRestoredDraft, setPrevRestoredDraft] = useState(restoredDraft);
  if (restoredDraft !== prevRestoredDraft) {
    setPrevRestoredDraft(restoredDraft);
    if (restoredDraft) {
      const hasUrlDeepLink = Boolean(
        urlResource || urlQuestionNumber || urlLevel || urlSubject
      );
      if (hasUrlDeepLink) {
        if (
          urlResource &&
          restoredDraft.resource_id === urlResource &&
          restoredDraft.selectedPaper
        ) {
          setSelectedPaper(restoredDraft.selectedPaper);
        }
      } else {
        const nextOrigin =
          restoredDraft.origin === "PAST_PAPER" ? "PAST_PAPER" : "USER_UPLOAD";
        setSelectedOrigin(nextOrigin);
        if (restoredDraft.selectedPaper) {
          setSelectedPaper(restoredDraft.selectedPaper);
        }
      }
    }
  }

  // Resolve level and subject whether passed as UUID, code, or name
  const resolvedLevelId = useMemo(() => {
    if (!urlLevel) return "";
    const found = levels.find(
      (l) =>
        l.id === urlLevel ||
        l.code?.toLowerCase() === urlLevel.toLowerCase() ||
        l.name?.toLowerCase() === urlLevel.toLowerCase()
    );
    return found ? found.id : urlLevel;
  }, [urlLevel, levels]);

  const resolvedSubjectId = useMemo(() => {
    if (!urlSubject) return "";
    const found = subjects.find(
      (s) =>
        s.id === urlSubject ||
        s.code?.toLowerCase() === urlSubject.toLowerCase() ||
        s.name?.toLowerCase() === urlSubject.toLowerCase()
    );
    return found ? found.id : urlSubject;
  }, [urlSubject, subjects]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    reset,
    control,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: selectedOrigin,
      title: "",
      body: "",
      subject_id: resolvedSubjectId || urlSubject,
      level_id: resolvedLevelId || urlLevel,
      source: "",
      resource_id: urlResource,
      question_number: urlQuestionNumber,
      tags: [],
      attachments: [],
    },
  });

  const isSubmitting = submitStage !== "idle";

  const persistCurrentDraft = useCallback(
    (overrides?: Partial<ProblemDraft>) => {
      const current = getValues();
      saveDraft({
        origin: current.origin,
        title: current.title || "",
        body: current.body || "",
        subject_id: current.subject_id || "",
        level_id: current.level_id || "",
        source: current.source || "",
        resource_id: current.resource_id || "",
        question_number: current.question_number || "",
        tags: current.tags || [],
        selectedPaper,
        hadAttachments: items.length > 0,
        ...overrides,
      });
    },
    [getValues, saveDraft, selectedPaper, items.length]
  );

  // Restore saved draft into RHF on mount if available
  useEffect(() => {
    if (!restoredDraft || appliedDraftRef.current) return;
    appliedDraftRef.current = true;

    const hasUrlDeepLink = Boolean(
      urlResource || urlQuestionNumber || urlLevel || urlSubject
    );

    if (hasUrlDeepLink) {
      if (urlResource && restoredDraft.resource_id === urlResource) {
        if (restoredDraft.title) setValue("title", restoredDraft.title);
        if (restoredDraft.body) setValue("body", restoredDraft.body);
        if (restoredDraft.question_number && !urlQuestionNumber) {
          setValue("question_number", restoredDraft.question_number);
        }
        if (Array.isArray(restoredDraft.tags) && restoredDraft.tags.length > 0) {
          setValue("tags", restoredDraft.tags);
        }
      }
      return;
    }

    const nextOrigin =
      restoredDraft.origin === "PAST_PAPER" ? "PAST_PAPER" : "USER_UPLOAD";
    reset({
      origin: nextOrigin,
      title: restoredDraft.title || "",
      body: restoredDraft.body || "",
      subject_id: restoredDraft.subject_id || "",
      level_id: restoredDraft.level_id || "",
      source: restoredDraft.source || "",
      resource_id: restoredDraft.resource_id || "",
      question_number: restoredDraft.question_number || "",
      tags: Array.isArray(restoredDraft.tags) ? restoredDraft.tags : [],
      attachments: [],
    });
  }, [
    restoredDraft,
    urlResource,
    urlQuestionNumber,
    urlLevel,
    urlSubject,
    setValue,
    reset,
  ]);

  const watchedValues = useWatch({ control });

  // Auto-save draft when user edits form fields
  useEffect(() => {
    if (!isDirty) return;
    saveDraft({
      origin: watchedValues.origin || selectedOrigin,
      title: watchedValues.title || "",
      body: watchedValues.body || "",
      subject_id: watchedValues.subject_id || "",
      level_id: watchedValues.level_id || "",
      source: watchedValues.source || "",
      resource_id: watchedValues.resource_id || "",
      question_number: watchedValues.question_number || "",
      tags: (watchedValues.tags as string[] | undefined) || [],
      selectedPaper,
      hadAttachments: items.length > 0,
    });
  }, [watchedValues, isDirty, saveDraft, selectedOrigin, selectedPaper, items.length]);

  // Sync URL parameters when navigated from Train or external deep-links
  useEffect(() => {
    if (urlResource) {
      setValue("origin", "PAST_PAPER");
      setValue("resource_id", urlResource, { shouldValidate: true });
    }
    if (resolvedLevelId) {
      setValue("level_id", resolvedLevelId, { shouldValidate: true });
    }
    if (resolvedSubjectId) {
      setValue("subject_id", resolvedSubjectId, { shouldValidate: true });
    }
    if (urlQuestionNumber) {
      setValue("question_number", urlQuestionNumber, { shouldValidate: true });
    }
  }, [
    urlResource,
    resolvedLevelId,
    resolvedSubjectId,
    urlQuestionNumber,
    setValue,
  ]);

  // Keep RHF attachments field synchronized with staged upload items
  useEffect(() => {
    setValue(
      "attachments",
      items.map((item) => item.file),
      { shouldValidate: isSubmitted || items.length > 0 }
    );
    if (items.length > 0) {
      clearErrors("attachments");
    }
  }, [items, setValue, clearErrors, isSubmitted]);

  // Elapsed timer for cold-start feedback (> 6s)
  useEffect(() => {
    if (!isSubmitting) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitting]);

  // Warn before unloading tab while uploads are active or form has unsaved edits
  useEffect(() => {
    const shouldWarn =
      isSubmitting || isUploading || isDirty || items.length > 0;
    if (!shouldWarn) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting, isUploading, isDirty, items.length]);

  const watchedResourceId = watchedValues.resource_id || "";
  const watchedQuestionNumber = watchedValues.question_number || "";
  const watchedLevelId = watchedValues.level_id || "";
  const watchedSubjectId = watchedValues.subject_id || "";
  const watchedBody = watchedValues.body || "";
  const watchedSource = watchedValues.source || "";

  // Fetch individual resource details when initialized from URL without full Resource metadata
  const { data: fetchedSelectedResource } = useQuery<Resource | null>({
    queryKey: ["resourceDetail", watchedResourceId],
    queryFn: async () => {
      if (!watchedResourceId) return null;
      const token = await getToken();
      return apiFetch<Resource>(
        `/resources/files/${watchedResourceId}/`,
        token ?? undefined
      );
    },
    enabled:
      !!watchedResourceId &&
      (!selectedPaper || selectedPaper.id !== watchedResourceId),
  });

  // Selected Resource entity for taxonomy inheritance and display
  const selectedResource = useMemo(() => {
    if (!watchedResourceId) return null;
    if (selectedPaper && selectedPaper.id === watchedResourceId) {
      return selectedPaper;
    }
    if (
      fetchedSelectedResource &&
      fetchedSelectedResource.id === watchedResourceId
    ) {
      return fetchedSelectedResource;
    }
    return null;
  }, [watchedResourceId, selectedPaper, fetchedSelectedResource]);

  // Populate level & subject when URL-loaded resource details arrive
  useEffect(() => {
    if (
      fetchedSelectedResource &&
      fetchedSelectedResource.id === watchedResourceId
    ) {
      const resLvl = getResourceTaxonomyId(
        fetchedSelectedResource.level_details,
        fetchedSelectedResource.level
      );
      const resSub = getResourceTaxonomyId(
        fetchedSelectedResource.subject_details,
        fetchedSelectedResource.subject
      );

      if (resLvl) {
        setValue("level_id", resLvl, { shouldValidate: true });
      }
      if (resSub) {
        setValue("subject_id", resSub, { shouldValidate: true });
      }
    }
  }, [fetchedSelectedResource, watchedResourceId, setValue]);

  const formatSession = (s?: string) => {
    if (s === "MAY_JUNE") return "May / June";
    if (s === "OCT_NOV") return "Oct / Nov";
    if (s === "JANUARY") return "January";
    if (s === "FEB_MARCH") return "Feb / March";
    return s || "";
  };

  // Debounced Deduplication Check for Path B (renders non-interruptive banner, does NOT auto-open modal)
  const [debouncedQuestion, setDebouncedQuestion] = useState(
    watchedQuestionNumber
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuestion(watchedQuestionNumber);
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedQuestionNumber]);

  const { data: dedupData } = useProblemByPaper(
    selectedOrigin === "PAST_PAPER" ? watchedResourceId : undefined,
    selectedOrigin === "PAST_PAPER" ? debouncedQuestion : undefined
  );

  useEffect(() => {
    if (errorFocusTick > 0) {
      errorBannerRef.current?.focus();
    }
  }, [errorFocusTick]);

  const handleUploadAndReturnNames = useCallback(
    async (files: File[]): Promise<Array<{ fileName: string }>> => {
      const res = await addFiles(files);
      persistCurrentDraft({ hadAttachments: true });
      return res.added.map((item) => ({ fileName: item.file.name }));
    },
    [addFiles, persistCurrentDraft]
  );

  const handleInsertFromDock = useCallback(
    (fileName: string) => {
      const current = getValues("body") || "";
      setValue("body", appendInlineImageToBody(current, fileName), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [getValues, setValue]
  );

  const handleOriginChange = (newOrigin: "USER_UPLOAD" | "PAST_PAPER") => {
    if (isSubmitting) return;
    setSelectedOrigin(newOrigin);
    setValue("origin", newOrigin);
    setServerError("");
    setServerFieldErrors({});
    clearErrors();
    persistCurrentDraft({ origin: newOrigin });
  };

  const handleSelectPaper = (paper: Resource) => {
    setSelectedPaper(paper);
    setValue("resource_id", paper.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
    const resLvl = getResourceTaxonomyId(paper.level_details, paper.level);
    const resSub = getResourceTaxonomyId(paper.subject_details, paper.subject);
    if (resLvl) {
      setValue("level_id", resLvl, { shouldValidate: true });
    }
    if (resSub) {
      setValue("subject_id", resSub, { shouldValidate: true });
    }
    persistCurrentDraft({
      origin: "PAST_PAPER",
      resource_id: paper.id,
      level_id: resLvl || getValues("level_id") || "",
      subject_id: resSub || getValues("subject_id") || "",
      selectedPaper: paper,
    });
  };

  const handlePathBLevelChange = (nextLevelId: string) => {
    setValue("level_id", nextLevelId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (selectedResource) {
      const resLvl = getResourceTaxonomyId(
        selectedResource.level_details,
        selectedResource.level
      );
      if (
        resLvl &&
        nextLevelId &&
        resLvl !== nextLevelId &&
        levels.some((l) => l.id === nextLevelId)
      ) {
        setValue("resource_id", "", { shouldValidate: true });
        setSelectedPaper(null);
        persistCurrentDraft({
          level_id: nextLevelId,
          resource_id: "",
          selectedPaper: null,
        });
        return;
      }
    }
    persistCurrentDraft({ level_id: nextLevelId });
  };

  const handlePathBSubjectChange = (nextSubjectId: string) => {
    setValue("subject_id", nextSubjectId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (selectedResource) {
      const resSub = getResourceTaxonomyId(
        selectedResource.subject_details,
        selectedResource.subject
      );
      if (
        resSub &&
        nextSubjectId &&
        resSub !== nextSubjectId &&
        subjects.some((s) => s.id === nextSubjectId)
      ) {
        setValue("resource_id", "", { shouldValidate: true });
        setSelectedPaper(null);
        persistCurrentDraft({
          subject_id: nextSubjectId,
          resource_id: "",
          selectedPaper: null,
        });
        return;
      }
    }
    persistCurrentDraft({ subject_id: nextSubjectId });
  };

  const handleDiscardDraft = () => {
    clearDraft();
    resetUploads();
    setSelectedPaper(null);
    setSelectedOrigin(urlOrigin);
    setServerError("");
    setServerFieldErrors({});
    reset({
      origin: urlOrigin,
      title: "",
      body: "",
      subject_id: resolvedSubjectId || urlSubject,
      level_id: resolvedLevelId || urlLevel,
      source: "",
      resource_id: urlResource,
      question_number: urlQuestionNumber,
      tags: [],
      attachments: [],
    });
    toast.info("Unsaved draft discarded.");
  };

  const onInvalid = () => {
    setServerError("Please review the highlighted fields before submitting.");
    setServerFieldErrors({});
    setErrorFocusTick((n) => n + 1);
  };

  const onSubmit = async (data: FormValues) => {
    if (data.origin === "USER_UPLOAD") {
      if (isOptimizing) {
        setServerError("Please wait for image optimization to finish.");
        setErrorFocusTick((n) => n + 1);
        return;
      }
      if (items.length < 1 || items.length > 3) {
        const msg =
          items.length < 1
            ? "At least 1 image attachment is required."
            : "Max 3 files allowed.";
        setError("attachments", { type: "manual", message: msg });
        setServerError(msg);
        setErrorFocusTick((n) => n + 1);
        return;
      }
    }

    setServerError("");
    setServerFieldErrors({});
    setElapsedSeconds(0);
    setSubmitStage(
      data.origin === "USER_UPLOAD" && items.length > 0 ? "uploading" : "saving"
    );

    try {
      if (data.origin === "USER_UPLOAD") {
        // 1. Upload staged images directly to Backblaze B2 temp/ first
        const uploaded = await uploadAll(getToken);

        setSubmitStage("saving");
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication required. Please sign in and retry.");
        }

        // 2. Commit Problem atomically with promoted temp keys
        const payload = {
          origin: "USER_UPLOAD",
          title: data.title.trim(),
          body: data.body.trim(),
          subject: data.subject_id,
          level: data.level_id,
          source: data.source?.trim() || "others",
          uploaded_attachments: uploaded.map(({ file_key, file_name }) => ({
            file_key,
            file_name,
          })),
          tags: data.tags || [],
        };

        const res = await apiFetch<Problem>("/problems/", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await queryClient.invalidateQueries({ queryKey: ["problems"] });
        clearDraft();
        resetUploads();
        toast.success("Problem posted successfully!");
        router.push(`/problems/${res.id}`);
      } else {
        setSubmitStage("saving");
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication required. Please sign in and retry.");
        }

        const payload = {
          origin: "PAST_PAPER",
          resource: data.resource_id,
          question_number: data.question_number.trim(),
          title: data.title?.trim() || "",
          body: data.body?.trim() || "",
          is_feed_visible: true,
          uploaded_attachments: [],
          tags: data.tags || [],
        };

        const res = await apiFetch<Problem>("/problems/", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await queryClient.invalidateQueries({ queryKey: ["problems"] });
        await queryClient.invalidateQueries({
          queryKey: ["paperProblems", data.resource_id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["by-paper", data.resource_id],
        });
        clearDraft();
        toast.success("Problem posted successfully!");
        router.push(`/problems/${res.id}`);
      }
    } catch (err: unknown) {
      const { serverMessage, fieldErrors } = extractApiFieldErrors(
        err,
        {
          subject: "subject_id",
          level: "level_id",
          resource: "resource_id",
          question: "question_number",
          tags: "tags",
          uploaded_attachments: "attachments",
          file: "attachments",
          attachments: "attachments",
        },
        "Failed to post problem."
      );

      setServerError(serverMessage);
      setServerFieldErrors(fieldErrors);
      applyFieldErrorsToForm(fieldErrors, setError);
      setErrorFocusTick((n) => n + 1);
    } finally {
      setSubmitStage("idle");
      setElapsedSeconds(0);
    }
  };

  const fieldErrorMap = errors as Partial<
    Record<
      | "title"
      | "body"
      | "subject_id"
      | "level_id"
      | "source"
      | "resource_id"
      | "question_number"
      | "tags"
      | "attachments",
      { message?: string }
    >
  >;

  const uploadingIndex = items.findIndex((i) => i.status === "uploading");
  const activeUploadProgress =
    uploadingIndex >= 0 ? items[uploadingIndex]?.progress ?? 0 : 0;

  const submitLabel =
    submitStage === "uploading" && items.length > 0
      ? uploadingIndex >= 0
        ? `Uploading ${uploadingIndex + 1}/${items.length} (${activeUploadProgress}%)…`
        : "Uploading photos…"
      : submitStage === "saving"
        ? "Posting…"
        : "Post Problem";

  const dedupSolutionCount =
    dedupData?.solutions?.length ?? dedupData?.problem?.solution_count ?? 0;

  const hasUrlDeepLink = Boolean(
    urlResource || urlQuestionNumber || urlLevel || urlSubject
  );
  const showRestoredBanner =
    hasRestoredDraft &&
    (!hasUrlDeepLink ||
      Boolean(urlResource && restoredDraft?.resource_id === urlResource));
  const showRestoredAttachmentNote =
    showRestoredBanner &&
    Boolean(restoredDraft?.hadAttachments) &&
    selectedOrigin === "USER_UPLOAD" &&
    items.length === 0;

  const sourceOpen =
    showSourceWell ||
    Boolean(watchedSource.trim()) ||
    Boolean(fieldErrorMap.source?.message);

  return (
    <>
      <ArchivalComposerShell
        backHref="/problems"
        backLabel="Solve!"
        cancelHref="/problems"
        mode={mode}
        onModeChange={setMode}
        charCount={watchedBody.length}
        maxChars={3000}
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
        submitDisabled={isOptimizing}
        isUploading={isUploading}
        onCancelUpload={() => cancelUpload()}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        autosaveLabel={isDirty ? "Draft saved locally" : undefined}
        draftBanner={{
          visible: showRestoredBanner,
          message: "Restored unsaved draft from this browser session.",
          missingMediaNote: showRestoredAttachmentNote
            ? "Selected photo files cannot persist across page reloads — please re-attach your images."
            : undefined,
          onDiscard: handleDiscardDraft,
          onDismiss: dismissRestoredNotice,
        }}
        errorBanner={
          <FormErrorBanner
            ref={errorBannerRef}
            serverMessage={serverError}
            fieldErrors={serverFieldErrors}
          />
        }
        coldStartNotice={
          isSubmitting && elapsedSeconds >= 6 ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground"
            >
              Server is waking up or finishing transfer — please keep this tab open.
            </p>
          ) : undefined
        }
        headerExtra={
          <div
            role="tablist"
            aria-label="Problem source type"
            className="flex flex-col sm:flex-row rounded-xl border border-border bg-muted/40 p-1 gap-1"
          >
            <button
              ref={pathATabRef}
              type="button"
              role="tab"
              aria-selected={selectedOrigin === "USER_UPLOAD"}
              tabIndex={selectedOrigin === "USER_UPLOAD" ? 0 : -1}
              disabled={isSubmitting}
              onClick={() => handleOriginChange("USER_UPLOAD")}
              onKeyDown={(e) => {
                if (
                  e.key === "ArrowRight" ||
                  e.key === "ArrowDown" ||
                  e.key === "ArrowLeft" ||
                  e.key === "ArrowUp"
                ) {
                  e.preventDefault();
                  handleOriginChange("PAST_PAPER");
                  pathBTabRef.current?.focus();
                }
              }}
              className={cn(
                "flex-1 flex min-h-[44px] sm:min-h-[36px] items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                selectedOrigin === "USER_UPLOAD"
                  ? "bg-card text-primary shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Camera className="size-4 shrink-0" aria-hidden="true" />
              <span>Manual Photo Upload (Path A)</span>
            </button>

            <button
              ref={pathBTabRef}
              type="button"
              role="tab"
              aria-selected={selectedOrigin === "PAST_PAPER"}
              tabIndex={selectedOrigin === "PAST_PAPER" ? 0 : -1}
              disabled={isSubmitting}
              onClick={() => handleOriginChange("PAST_PAPER")}
              onKeyDown={(e) => {
                if (
                  e.key === "ArrowRight" ||
                  e.key === "ArrowDown" ||
                  e.key === "ArrowLeft" ||
                  e.key === "ArrowUp"
                ) {
                  e.preventDefault();
                  handleOriginChange("USER_UPLOAD");
                  pathATabRef.current?.focus();
                }
              }}
              className={cn(
                "flex-1 flex min-h-[44px] sm:min-h-[36px] items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                selectedOrigin === "PAST_PAPER"
                  ? "bg-card text-primary shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="size-4 shrink-0" aria-hidden="true" />
              <span>Curated Past Paper (Path B)</span>
            </button>
          </div>
        }
      >
        <input type="hidden" {...register("origin")} value={selectedOrigin} />

        {/* Path A Workflow */}
        {selectedOrigin === "USER_UPLOAD" && (
          <>
            <MetadataPillBar
              errors={[
                fieldErrorMap.subject_id?.message,
                fieldErrorMap.level_id?.message,
                fieldErrorMap.source?.message,
                fieldErrorMap.tags?.message,
              ]}
            >
              <MetadataSelectPill
                id={subjectIdA}
                label="Subject"
                required
                invalid={!!fieldErrorMap.subject_id}
                disabled={isSubmitting}
                {...register("subject_id")}
                value={watchedSubjectId}
                onChange={(e) => {
                  setValue("subject_id", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  persistCurrentDraft({ subject_id: e.target.value });
                }}
              >
                <option value="">Subject *</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </MetadataSelectPill>

              <MetadataSelectPill
                id={levelIdA}
                label="Education Level"
                required
                invalid={!!fieldErrorMap.level_id}
                disabled={isSubmitting}
                {...register("level_id")}
                value={watchedLevelId}
                onChange={(e) => {
                  setValue("level_id", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  persistCurrentDraft({ level_id: e.target.value });
                }}
              >
                <option value="">Level *</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </MetadataSelectPill>

              <MetadataTogglePill
                active={sourceOpen}
                hasValue={Boolean(watchedSource.trim())}
                onClick={() => setShowSourceWell((prev) => !prev)}
                icon={<TagIcon className="size-3.5 text-primary" aria-hidden="true" />}
              >
                {watchedSource.trim() ? `Source: ${watchedSource.trim()}` : "Add Source"}
              </MetadataTogglePill>
            </MetadataPillBar>

            {sourceOpen && (
              <div className="rounded-xl border border-border bg-card/70 p-3.5 space-y-1.5">
                <label
                  htmlFor={sourceIdA}
                  className="text-xs font-medium text-foreground"
                >
                  Source / Reference (Optional)
                </label>
                <Input
                  id={sourceIdA}
                  {...register("source")}
                  disabled={isSubmitting}
                  placeholder="e.g. Oxford Pure Maths Ex 7B or Cambridge 9709 Homework"
                  aria-invalid={!!fieldErrorMap.source}
                  className="text-base sm:text-sm"
                />
              </div>
            )}

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput
                  value={field.value || []}
                  onChange={(nextTags) => {
                    field.onChange(nextTags);
                    persistCurrentDraft({ tags: nextTags });
                  }}
                  maxTags={3}
                  disabled={isSubmitting}
                  error={fieldErrorMap.tags?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <ArchivalTitleInput
                  id={titleId}
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={150}
                  disabled={isSubmitting}
                  placeholder="e.g. Stuck on trigonometric identity verification..."
                  error={fieldErrorMap.title?.message}
                  aria-invalid={!!fieldErrorMap.title}
                />
              )}
            />

            <div className="space-y-1.5">
              <Controller
                control={control}
                name="body"
                render={({ field }) => (
                  <BlockDocumentEditor
                    id={bodyIdA}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    mode={mode}
                    attachments={mediaItems}
                    canUploadMore={items.length < PROBLEM_RULE.maxFiles}
                    acceptString={PROBLEM_RULE.acceptString}
                    onUploadImages={handleUploadAndReturnNames}
                    maxLength={3000}
                    disabled={isSubmitting}
                    aria-invalid={!!fieldErrorMap.body}
                    placeholder="Describe your current steps, where you are stuck, or insert question photos inline between paragraphs..."
                    emptyPreviewText="Nothing to preview yet. Describe your problem or insert a photo."
                  />
                )}
              />
              {fieldErrorMap.body?.message && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {fieldErrorMap.body.message}
                </p>
              )}
            </div>

            <MediaDock
              scope="problem_attachment"
              title="Question Photos"
              required
              body={watchedBody}
              stagedItems={items}
              onAddFiles={async (incoming) => {
                const res = await addFiles(incoming);
                persistCurrentDraft({ hadAttachments: true });
                return res;
              }}
              onRemoveStaged={removeFile}
              onRetryStaged={(id) => void retryItem(id, getToken)}
              onInsertInlineImage={handleInsertFromDock}
              helperText="1 to 3 images required (JPG, PNG, WebP). Photos up to 25 MB are automatically optimized to WebP (<= 5 MB final)."
              error={batchError || fieldErrorMap.attachments?.message}
              disabled={isSubmitting}
            />
          </>
        )}

        {/* Path B Workflow */}
        {selectedOrigin === "PAST_PAPER" && (
          <>
            <MetadataPillBar
              errors={[
                fieldErrorMap.level_id?.message,
                fieldErrorMap.subject_id?.message,
                fieldErrorMap.resource_id?.message,
                fieldErrorMap.question_number?.message,
                fieldErrorMap.tags?.message,
              ]}
            >
              <MetadataSelectPill
                id={levelIdB}
                label="Education Level"
                required
                invalid={!!fieldErrorMap.level_id}
                disabled={isSubmitting}
                {...register("level_id")}
                value={watchedLevelId}
                onChange={(e) => handlePathBLevelChange(e.target.value)}
              >
                <option value="">Level *</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </MetadataSelectPill>

              <MetadataSelectPill
                id={subjectIdB}
                label="Subject"
                required
                invalid={!!fieldErrorMap.subject_id}
                disabled={isSubmitting}
                {...register("subject_id")}
                value={watchedSubjectId}
                onChange={(e) => handlePathBSubjectChange(e.target.value)}
              >
                <option value="">Subject *</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </MetadataSelectPill>
            </MetadataPillBar>

            {/* Curated Past Paper Picker + Q# */}
            <input type="hidden" {...register("resource_id")} />

            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {!selectedResource ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-dashed border-border bg-muted/35 p-3.5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => setPaperModalOpen(true)}
                    className="min-h-[44px] sm:min-h-[36px] px-4 gap-2 font-semibold text-xs shrink-0"
                  >
                    <FolderOpen className="size-4 text-primary" aria-hidden="true" />
                    <span>Select a Paper in Resources</span>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Browse, preview, and select curated past papers without leaving this composer.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
                      <DocTypeIcon
                        filename={
                          selectedResource.file_name ||
                          selectedResource.title ||
                          ""
                        }
                        resourceType={selectedResource.resource_type}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className="font-semibold text-foreground text-xs sm:text-sm truncate"
                        title={
                          selectedResource.title || selectedResource.file_name
                        }
                      >
                        {selectedResource.title ||
                          selectedResource.file_name ||
                          "Past Paper"}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {selectedResource.session && (
                          <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md">
                            {formatSession(selectedResource.session)}
                          </span>
                        )}
                        {selectedResource.paper_type && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs uppercase font-semibold",
                              selectedResource.paper_type === "QP"
                                ? "border-primary/35 text-primary bg-primary/10"
                                : "border-border text-secondary-foreground bg-secondary"
                            )}
                          >
                            {selectedResource.paper_type === "QP"
                              ? "Question Paper"
                              : "Mark Scheme"}
                          </Badge>
                        )}
                        {selectedResource.year && (
                          <Badge
                            variant="secondary"
                            className="font-mono tabular-nums text-xs"
                          >
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
                      disabled={isSubmitting}
                      onClick={() => setPaperModalOpen(true)}
                      className="min-h-[44px] sm:min-h-[32px] px-2.5 gap-1.5 text-xs font-semibold"
                    >
                      <FolderOpen className="size-3.5" aria-hidden="true" />
                      <span>Change Paper</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isSubmitting}
                      onClick={() => {
                        setValue("resource_id", "", {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setSelectedPaper(null);
                        persistCurrentDraft({
                          resource_id: "",
                          selectedPaper: null,
                        });
                      }}
                      className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Remove selected paper"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor={qNumIdB}
                  className="text-xs font-medium text-foreground"
                >
                  Question Number <span className="text-destructive">*</span>
                </label>
                <Input
                  id={qNumIdB}
                  {...register("question_number")}
                  disabled={isSubmitting}
                  placeholder="e.g. Q4(b) or Question 3"
                  aria-invalid={!!fieldErrorMap.question_number}
                  className="text-base sm:text-sm"
                />
              </div>
            </div>

            {/* Non-interruptive inline deduplication callout */}
            {dedupData?.exists && dedupData.problem && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    An existing thread was found for{" "}
                    <span className="font-mono">
                      {dedupData.problem.question_number || watchedQuestionNumber}
                    </span>{" "}
                    (
                    <span className="font-mono tabular-nums">
                      {dedupSolutionCount}
                    </span>{" "}
                    {dedupSolutionCount === 1 ? "solution" : "solutions"})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dedupData.problem.is_feed_visible
                      ? "Review existing solutions before creating a duplicate discussion."
                      : "Proactive walkthrough solutions exist — preview or promote to public feed."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDrawerOpen(true)}
                  className="shrink-0 gap-1.5 text-xs font-semibold"
                >
                  <Eye className="size-3.5" aria-hidden="true" />
                  <span>Preview Existing Solutions</span>
                </Button>
              </div>
            )}

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput
                  value={field.value || []}
                  onChange={(nextTags) => {
                    field.onChange(nextTags);
                    persistCurrentDraft({ tags: nextTags });
                  }}
                  maxTags={3}
                  disabled={isSubmitting}
                  error={fieldErrorMap.tags?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <ArchivalTitleInput
                  id={titleIdB}
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={150}
                  disabled={isSubmitting}
                  placeholder={
                    selectedResource
                      ? `${selectedResource.title || selectedResource.file_name} — ${watchedQuestionNumber || "Question"}`
                      : "Optional custom title (auto-derived if left blank)"
                  }
                  error={fieldErrorMap.title?.message}
                  aria-invalid={!!fieldErrorMap.title}
                />
              )}
            />

            <div className="space-y-1.5">
              <Controller
                control={control}
                name="body"
                render={({ field }) => (
                  <MarkdownMathEditor
                    id={bodyIdB}
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    mode={mode}
                    variant="borderless"
                    maxLength={3000}
                    rows={5}
                    disabled={isSubmitting}
                    aria-invalid={!!fieldErrorMap.body}
                    placeholder="Add any specific context or question about this past-paper problem (optional)..."
                  />
                )}
              />
              {fieldErrorMap.body?.message && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {fieldErrorMap.body.message}
                </p>
              )}
            </div>

            {/* Informational Banner replacing Image Dropzone */}
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Check className="size-4 text-primary shrink-0" aria-hidden="true" />
              <span>
                This question references the platform-curated exam paper directly. No image upload is needed.
              </span>
            </div>
          </>
        )}
      </ArchivalComposerShell>

      {/* In-Place Past Paper Selector Modal for Path B */}
      <PastPaperSelectorModal
        isOpen={paperModalOpen}
        onClose={() => setPaperModalOpen(false)}
        levelId={watchedLevelId}
        subjectId={watchedSubjectId}
        levelName={levels.find((l) => l.id === watchedLevelId)?.name}
        subjectName={subjects.find((s) => s.id === watchedSubjectId)?.name}
        selectedPaperId={watchedResourceId || undefined}
        onSelectPaper={handleSelectPaper}
      />

      {/* Instant Solution Preview Drawer for Path B */}
      {selectedOrigin === "PAST_PAPER" && dedupData?.problem && (
        <PreCreationPreviewDrawer
          isOpen={previewDrawerOpen}
          onClose={() => setPreviewDrawerOpen(false)}
          resourceTitle={
            selectedResource?.title ||
            selectedResource?.file_name ||
            "Past Paper"
          }
          questionNumber={watchedQuestionNumber || ""}
          existingProblem={dedupData.problem}
          existingSolutions={dedupData.solutions || []}
          onPromoteToPublic={() => {
            setPreviewDrawerOpen(false);
          }}
        />
      )}
    </>
  );
}
