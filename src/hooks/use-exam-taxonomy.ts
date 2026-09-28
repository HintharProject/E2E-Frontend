import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { toast } from "sonner";

export interface ExamTaxonomySession {
  id?: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface ExamTaxonomyData {
  years: (string | number)[];
  sessions: ExamTaxonomySession[];
}

export interface ExamYearItem {
  id: string;
  year: string | number;
  is_active: boolean;
  created_at: string;
}

export interface ExamSessionItem {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ModerationReasonItem {
  id: string;
  code: string;
  label: string;
  description: string;
  default_severity: "LOW" | "NORMAL" | "HIGH_PRIORITY" | "CRITICAL";
  is_active: boolean;
  created_at: string;
}

const FALLBACK_YEARS: (string | number)[] = ["2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "others"];
const FALLBACK_SESSIONS: ExamTaxonomySession[] = [
  { code: "MAY_JUNE", name: "May / June", is_active: true },
  { code: "OCT_NOV", name: "Oct / Nov", is_active: true },
  { code: "JANUARY", name: "January", is_active: true },
  { code: "FEB_MARCH", name: "Feb / March", is_active: true },
  { code: "OTHERS", name: "Others", is_active: true },
];

export function useExamTaxonomy() {
  const { getToken } = useAuth();

  return useQuery<ExamTaxonomyData>({
    queryKey: ["examTaxonomy"],
    queryFn: async () => {
      try {
        const token = await getToken().catch(() => null);
        const res = await apiFetch<any>("/exam-taxonomy/", token);
        return {
          years: res?.years?.length ? res.years : FALLBACK_YEARS,
          sessions: res?.sessions?.length ? res.sessions : FALLBACK_SESSIONS,
        };
      } catch {
        return {
          years: FALLBACK_YEARS,
          sessions: FALLBACK_SESSIONS,
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Exam Years CRUD ─────────────────────────────────────────────────────────
export function useExamYears() {
  const { getToken } = useAuth();
  return useQuery<ExamYearItem[]>({
    queryKey: ["adminExamYears"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/exam-years/", token);
      return Array.isArray(res) ? res : res?.results || [];
    },
  });
}

export function useCreateExamYear() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ year, is_active }: { year: string | number; is_active?: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch("/exam-years/", token, {
        method: "POST",
        body: JSON.stringify({ year, is_active: is_active ?? true }),
      });
    },
    onSuccess: () => {
      toast.success("Exam year added");
      queryClient.invalidateQueries({ queryKey: ["adminExamYears"] });
      queryClient.invalidateQueries({ queryKey: ["examTaxonomy"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to add exam year";
      toast.error(msg);
    },
  });
}

export function useUpdateExamYear() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExamYearItem> }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/exam-years/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Exam year updated");
      queryClient.invalidateQueries({ queryKey: ["adminExamYears"] });
      queryClient.invalidateQueries({ queryKey: ["examTaxonomy"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update exam year";
      toast.error(msg);
    },
  });
}

export function useDeleteExamYear() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/exam-years/${id}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Exam year deleted");
      queryClient.invalidateQueries({ queryKey: ["adminExamYears"] });
      queryClient.invalidateQueries({ queryKey: ["examTaxonomy"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete exam year";
      toast.error(msg);
    },
  });
}

// ── Exam Sessions CRUD ──────────────────────────────────────────────────────
export function useExamSessions() {
  const { getToken } = useAuth();
  return useQuery<ExamSessionItem[]>({
    queryKey: ["adminExamSessions"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/exam-sessions/", token);
      return Array.isArray(res) ? res : res?.results || [];
    },
  });
}

export function useCreateExamSession() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, name, is_active }: { code: string; name: string; is_active?: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch("/exam-sessions/", token, {
        method: "POST",
        body: JSON.stringify({ code: code.trim().toUpperCase(), name: name.trim(), is_active: is_active ?? true }),
      });
    },
    onSuccess: () => {
      toast.success("Exam session added");
      queryClient.invalidateQueries({ queryKey: ["adminExamSessions"] });
      queryClient.invalidateQueries({ queryKey: ["examTaxonomy"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to add exam session";
      toast.error(msg);
    },
  });
}

export function useUpdateExamSession() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExamSessionItem> }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/exam-sessions/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Exam session updated");
      queryClient.invalidateQueries({ queryKey: ["adminExamSessions"] });
      queryClient.invalidateQueries({ queryKey: ["examTaxonomy"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update exam session";
      toast.error(msg);
    },
  });
}

export function useDeleteExamSession() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/exam-sessions/${id}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Exam session deleted");
      queryClient.invalidateQueries({ queryKey: ["adminExamSessions"] });
      queryClient.invalidateQueries({ queryKey: ["examTaxonomy"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete exam session";
      toast.error(msg);
    },
  });
}

// ── Moderation Reasons CRUD ────────────────────────────────────────────────
export function useModerationReasons() {
  const { getToken } = useAuth();
  return useQuery<ModerationReasonItem[]>({
    queryKey: ["adminModerationReasons"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/moderation-reasons/", token);
      return Array.isArray(res) ? res : res?.results || [];
    },
  });
}

export function useCreateModerationReason() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      code: string;
      label: string;
      description?: string;
      default_severity: "LOW" | "NORMAL" | "HIGH_PRIORITY" | "CRITICAL";
      is_active?: boolean;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch("/moderation-reasons/", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Violation reason added");
      queryClient.invalidateQueries({ queryKey: ["adminModerationReasons"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create violation reason";
      toast.error(msg);
    },
  });
}

export function useUpdateModerationReason() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ModerationReasonItem> }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/moderation-reasons/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Violation reason updated");
      queryClient.invalidateQueries({ queryKey: ["adminModerationReasons"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update reason";
      toast.error(msg);
    },
  });
}

export function useDeleteModerationReason() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/moderation-reasons/${id}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Violation reason deleted");
      queryClient.invalidateQueries({ queryKey: ["adminModerationReasons"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete reason";
      toast.error(msg);
    },
  });
}

// ── Tags & Merge CRUD ───────────────────────────────────────────────────────
export interface TagItem {
  id: string;
  name: string;
  post_count: number;
  lesson_count: number;
}

export function useTagsWithMetrics(search?: string) {
  const { getToken } = useAuth();
  return useQuery<TagItem[]>({
    queryKey: ["adminTagsWithMetrics", search],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const qs = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await apiFetch<any>(`/tags/${qs}`, token);
      return Array.isArray(res) ? res : res?.results || [];
    },
  });
}

export function useCreateTag() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch("/tags/", token, {
        method: "POST",
        body: JSON.stringify({ name: name.trim().toLowerCase() }),
      });
    },
    onSuccess: () => {
      toast.success("Tag created");
      queryClient.invalidateQueries({ queryKey: ["adminTagsWithMetrics"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create tag";
      toast.error(msg);
    },
  });
}

export function useUpdateTag() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/tags/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim().toLowerCase() }),
      });
    },
    onSuccess: () => {
      toast.success("Tag updated");
      queryClient.invalidateQueries({ queryKey: ["adminTagsWithMetrics"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update tag";
      toast.error(msg);
    },
  });
}

export function useDeleteTag() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/tags/${id}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Tag deleted");
      queryClient.invalidateQueries({ queryKey: ["adminTagsWithMetrics"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete tag";
      toast.error(msg);
    },
  });
}

export function useMergeTags() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      primary_tag_id,
      merge_tag_ids,
    }: {
      primary_tag_id: string;
      merge_tag_ids: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<any>("/tags/merge/", token, {
        method: "POST",
        body: JSON.stringify({ primary_tag_id, merge_tag_ids }),
      });
    },
    onSuccess: (res: any) => {
      const mergedCount = res?.affected_posts ?? 0;
      toast.success(`Tags merged successfully (${mergedCount} posts re-linked)`);
      queryClient.invalidateQueries({ queryKey: ["adminTagsWithMetrics"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to merge tags";
      toast.error(msg);
    },
  });
}

// ── Subjects CRUD ───────────────────────────────────────────────────────────
export interface SubjectItem {
  id: string;
  code: string;
  name: string;
}

export function useSubjects() {
  const { getToken } = useAuth();
  return useQuery<SubjectItem[]>({
    queryKey: ["adminSubjects"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/subjects/", token);
      return Array.isArray(res) ? res : res?.results || [];
    },
  });
}

export function useCreateSubject() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { code: string; name: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch("/subjects/", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Subject created");
      queryClient.invalidateQueries({ queryKey: ["adminSubjects"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create subject";
      toast.error(msg);
    },
  });
}

export function useUpdateSubject() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubjectItem> }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/subjects/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Subject updated");
      queryClient.invalidateQueries({ queryKey: ["adminSubjects"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update subject";
      toast.error(msg);
    },
  });
}

export function useDeleteSubject() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/subjects/${id}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Subject deleted");
      queryClient.invalidateQueries({ queryKey: ["adminSubjects"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete subject";
      toast.error(msg);
    },
  });
}

// ── Levels CRUD ─────────────────────────────────────────────────────────────
export interface LevelItem {
  id: string;
  code: string;
  name: string;
}

export function useLevels() {
  const { getToken } = useAuth();
  return useQuery<LevelItem[]>({
    queryKey: ["adminLevels"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/levels/", token);
      return Array.isArray(res) ? res : res?.results || [];
    },
  });
}

export function useCreateLevel() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { code: string; name: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch("/levels/", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Level created");
      queryClient.invalidateQueries({ queryKey: ["adminLevels"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create level";
      toast.error(msg);
    },
  });
}

export function useUpdateLevel() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LevelItem> }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/levels/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Level updated");
      queryClient.invalidateQueries({ queryKey: ["adminLevels"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update level";
      toast.error(msg);
    },
  });
}

export function useDeleteLevel() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/levels/${id}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Level deleted");
      queryClient.invalidateQueries({ queryKey: ["adminLevels"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete level";
      toast.error(msg);
    },
  });
}

// ── Unclassified & Fallback Content Triage ──────────────────────────────────
export interface UnclassifiedContentItem {
  id: string;
  content_type: "post" | "problem" | "lesson" | "resource";
  title: string;
  file_url?: string;
  subject: { id: string; code: string; name: string } | null;
  level: { id: string; code: string; name: string } | null;
  year: string | number | null;
  session: string | null;
  tags: { id: string; name: string }[];
  issues: ("undefined_subject" | "undefined_level" | "other_year" | "other_session")[];
  author?: string | null;
  created_at: string | null;
}

export interface UnclassifiedContentResponse {
  counts: {
    total: number;
    posts: number;
    problems: number;
    lessons: number;
    resources: number;
    undefined_subjects: number;
    undefined_levels: number;
    other_years: number;
    other_sessions: number;
  };
  results: UnclassifiedContentItem[];
}

export function useUnclassifiedContents(filters?: {
  contentType?: string;
  issueType?: string;
  search?: string;
}) {
  const { getToken } = useAuth();

  return useQuery<UnclassifiedContentResponse>({
    queryKey: ["unclassifiedContents", filters],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const params = new URLSearchParams();
      if (filters?.contentType && filters.contentType !== "all") {
        params.set("content_type", filters.contentType);
      }
      if (filters?.issueType && filters.issueType !== "all") {
        params.set("issue_type", filters.issueType);
      }
      if (filters?.search) {
        params.set("search", filters.search);
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      return apiFetch<UnclassifiedContentResponse>(`/unclassified-contents/${queryString}`, token);
    },
  });
}

export function useReassignUnclassifiedContent() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentType,
      id,
      data,
    }: {
      contentType: string;
      id: string;
      data: {
        subject_id?: string;
        level_id?: string;
        year?: string | number;
        session?: string;
        tag_ids?: string[];
      };
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      return apiFetch(`/unclassified-contents/${contentType}/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      toast.success("Content reclassified successfully");
      queryClient.invalidateQueries({ queryKey: ["unclassifiedContents"] });
      queryClient.invalidateQueries({ queryKey: ["adminResourcesList"] });
      queryClient.invalidateQueries({ queryKey: ["examTaxonomy"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to reclassify content";
      toast.error(msg);
    },
  });
}

