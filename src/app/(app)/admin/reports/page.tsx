"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { ReportedItemInspector } from "@/components/features/admin/reported-item-inspector";
import { ModerationBatchDock } from "@/components/features/admin/moderation-batch-dock";
import { ManageSanctionModal } from "@/components/features/admin/manage-sanction-modal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isAdminOrSuperAdmin, BanState } from "@/types/user";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { ReportItem, ReportCounts, TargetType, TargetAuthor } from "@/types/moderation";
import Link from "next/link";
import {
  Loader2,
  Trash2,
  EyeOff,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  CheckCheck,
  MessageSquare,
  BookOpen,
  Quote,
  User,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const CONTENT_TABS = [
  { id: "ALL", label: "All Items" },
  { id: "PROBLEM", label: "Problems" },
  { id: "SOLUTION", label: "Solutions" },
  { id: "POST", label: "Posts" },
  { id: "LESSON", label: "Lessons" },
  { id: "COMMENT", label: "Comments" },
  { id: "USER", label: "Profiles" },
] as const;

const REASON_OPTIONS = [
  { value: "ALL", label: "All Reasons" },
  { value: "SPAM", label: "Spam / Promo" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate" },
  { value: "CHEATING_ACADEMIC_DISHONESTY", label: "Cheating / Academic" },
  { value: "COPYRIGHT_VIOLATION", label: "Copyright" },
  { value: "OTHER", label: "Other" },
];

const SEVERITY_OPTIONS = [
  { value: "ALL", label: "All Severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH_PRIORITY", label: "High Priority" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
];

function AdminReportsContent() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();
  const isAdmin = isAdminOrSuperAdmin(currentUser?.role);

  // Tab & Filters state
  const initialTab = (searchParams.get("tab")?.toUpperCase() || "ALL") as string;
  const [selectedTab, setSelectedTab] = useState<string>(
    ["ALL", "PROBLEM", "SOLUTION", "POST", "LESSON", "COMMENT", "USER"].includes(initialTab)
      ? initialTab
      : "ALL"
  );
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Multi-selection state
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  // Inspector slide-over state
  const [inspectingReport, setInspectingReport] = useState<ReportItem | null>(null);

  // Author sanction modal state
  const [sanctionUser, setSanctionUser] = useState<TargetAuthor | null>(null);

  // Metadata
  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

  // 1. Fetch pending counts for all tabs
  const { data: counts } = useQuery<ReportCounts>({
    queryKey: ["adminReportsCounts"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return { all: 0, problems: 0, solutions: 0, posts: 0, lessons: 0, comments: 0, profiles: 0 };
      const res = await apiFetch<ReportCounts | { data: ReportCounts }>("/reports/counts/", token);
      if (res && typeof res === "object" && "data" in res && res.data) {
        return res.data;
      }
      return (res as ReportCounts) || { all: 0, problems: 0, solutions: 0, posts: 0, lessons: 0, comments: 0, profiles: 0 };
    },
    refetchInterval: 30000,
  });

  // 2. Fetch reports queue based on faceted filters
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedTab !== "ALL") params.set("target_type", selectedTab);
    if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
    if (subjectFilter) params.set("subject_id", subjectFilter);
    if (levelFilter) params.set("level_id", levelFilter);
    if (reasonFilter && reasonFilter !== "ALL") params.set("reason", reasonFilter);
    if (severityFilter && severityFilter !== "ALL") params.set("severity", severityFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    return `/reports/queue/?${params.toString()}`;
  }, [selectedTab, statusFilter, subjectFilter, levelFilter, reasonFilter, severityFilter, searchQuery]);

  const { data: reports = [], isLoading } = useQuery<ReportItem[]>({
    queryKey: ["adminReports", queryUrl],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<ReportItem[] | { data: ReportItem[]; results?: ReportItem[] }>(queryUrl, token);
      if (Array.isArray(res)) return res;
      if (res && "data" in res && Array.isArray(res.data)) return res.data;
      if (res && "results" in res && Array.isArray(res.results)) return res.results;
      return [];
    },
  });

  // Mutations for single row actions
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      return apiFetch(`/reports/${id}/status/`, token as string, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Report ${vars.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReportsCounts"] });
      setSelectedReportIds((prev) => prev.filter((id) => id !== vars.id));
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update report";
      toast.error(msg);
    },
  });

  const takedownMutation = useMutation({
    mutationFn: async ({
      target_id,
      target_type,
      action,
    }: {
      reportId: string;
      target_id: string;
      target_type: string;
      action: string;
    }) => {
      const token = await getToken();
      return apiFetch(`/takedown/`, token as string, {
        method: "POST",
        body: JSON.stringify({ target_id, target_type, action }),
      });
    },
    onSuccess: async (_, vars) => {
      toast.success(`Content ${vars.action} completed`);
      await updateStatusMutation.mutateAsync({ id: vars.reportId, status: "RESOLVED" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to perform takedown";
      toast.error(msg);
    },
  });

  // Selection handlers
  const allCurrentIds = useMemo(() => reports.map((r) => r.id), [reports]);
  const isAllSelected =
    reports.length > 0 && allCurrentIds.every((id) => selectedReportIds.includes(id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedReportIds((prev) => prev.filter((id) => !allCurrentIds.includes(id)));
    } else {
      setSelectedReportIds((prev) => Array.from(new Set([...prev, ...allCurrentIds])));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedReportIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleResetFilters() {
    setSubjectFilter("");
    setLevelFilter("");
    setReasonFilter("ALL");
    setSeverityFilter("ALL");
    setSearchQuery("");
    setStatusFilter("PENDING");
  }

  const hasActiveFilters =
    Boolean(subjectFilter) ||
    Boolean(levelFilter) ||
    reasonFilter !== "ALL" ||
    severityFilter !== "ALL" ||
    Boolean(searchQuery.trim()) ||
    statusFilter !== "PENDING";

  function getCountForTab(tabId: string): number {
    if (!counts) return 0;
    switch (tabId) {
      case "ALL":
        return counts.all || 0;
      case "PROBLEM":
        return counts.problems || 0;
      case "SOLUTION":
        return counts.solutions || 0;
      case "POST":
        return counts.posts || 0;
      case "LESSON":
        return counts.lessons || 0;
      case "COMMENT":
        return counts.comments || 0;
      case "USER":
        return counts.profiles || 0;
      default:
        return 0;
    }
  }

  function renderTargetIcon(type: TargetType) {
    switch (type) {
      case "PROBLEM":
        return <HelpCircle className="size-3.5 text-amber-500 shrink-0" />;
      case "SOLUTION":
        return <CheckCheck className="size-3.5 text-emerald-500 shrink-0" />;
      case "POST":
        return <MessageSquare className="size-3.5 text-sky-500 shrink-0" />;
      case "LESSON":
        return <BookOpen className="size-3.5 text-indigo-500 shrink-0" />;
      case "COMMENT":
        return <Quote className="size-3.5 text-purple-500 shrink-0" />;
      case "USER":
        return <User className="size-3.5 text-rose-500 shrink-0" />;
      default:
        return <ShieldAlert className="size-3.5" />;
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header */}
      <PageHeader
        title="Enterprise Moderation Queue"
        description="Unified command center for content integrity, community safety, and academic triage."
      />

      {/* Sub navigation bar */}
      <SubNav
        items={[
          { href: "/admin/reports", label: "Moderation Queue", active: true },
          { href: "/admin/taxonomy?tab=tags", label: "Tag Merge Studio" },
          { href: "/admin/taxonomy?tab=unclassified", label: "Content Triage" },
          ...(isAdmin ? [{ href: "/admin/audit-logs", label: "Audit Logs" }] : []),
        ]}
      />

      {/* 1. Content Type Tabs */}
      <div className="border-b border-line">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CONTENT_TABS.map((tab) => {
            const count = getCountForTab(tab.id);
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  setSelectedReportIds([]);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-ink-muted hover:text-ink"
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-brand/15 text-brand"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Faceted Filter Bar & Workflow Status Pills */}
      <div className="rounded-2xl border border-line bg-card p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl">
            {(["PENDING", "RESOLVED", "DISMISSED", "ALL"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === st
                    ? "bg-card text-ink font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {st === "PENDING"
                  ? "Pending"
                  : st === "RESOLVED"
                  ? "Resolved"
                  : st === "DISMISSED"
                  ? "Dismissed"
                  : "All Statuses"}
              </button>
            ))}
          </div>

          {/* Reset Filters Shortcut */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-ink-muted hover:text-ink h-8 px-2.5"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset Filters
            </Button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Search Query */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-ink-muted" />
            <Input
              placeholder="Search targets or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-background px-3 text-xs text-ink focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-background px-3 text-xs text-ink focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Levels</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Reason Filter */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-background px-3 text-xs text-ink focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            {REASON_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-background px-3 text-xs text-ink focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Reports Queue Table */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted mx-auto text-ink-muted">
              <CheckCircle2 className="size-6 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-ink">Queue is Clear!</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              No reports match your selected criteria. Platform content is clean and adhering to
              community guidelines.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted/60 border-b border-line text-xs font-semibold text-ink-muted uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-line text-primary focus:ring-primary/20 cursor-pointer"
                      aria-label="Select all reports"
                    />
                  </th>
                  <th className="p-4 font-semibold">Reported Target</th>
                  <th className="p-4 font-semibold">Reason & Severity</th>
                  <th className="p-4 font-semibold">Reporter</th>
                  <th className="p-4 font-semibold">Author / Offender</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reports.map((r) => {
                  const target = r.target_details;
                  const author = target?.author || (r.target_type === "USER" && target ? {
                    id: r.target_id,
                    display_name: target.display_name || target.title?.replace("User Profile: ", "") || "Reported User",
                    email: target.email || "",
                    role: target.role || "STUDENT",
                    ban_status: target.ban_status || "ACTIVE",
                    ban_expires_at: target.ban_expires_at || null,
                    lifetime_reports_received: target.lifetime_reports_received ?? 0,
                    contributor_tier: target.contributor_tier ?? 1,
                    profile_image_url: target.profile_image_url,
                  } : target?.author);
                  const reporter = r.reporter_details;
                  const isSelected = selectedReportIds.includes(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(r.id)}
                          className="size-4 rounded border-line text-primary focus:ring-primary/20 cursor-pointer"
                          aria-label={`Select report ${r.id}`}
                        />
                      </td>

                      {/* Reported Target */}
                      <td className="p-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-bold text-ink">
                              {renderTargetIcon(r.target_type)}
                              <span>{r.target_type}</span>
                            </span>
                            {target?.subject && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                {target.subject.code}
                              </Badge>
                            )}
                            {target?.level && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                {target.level.name}
                              </Badge>
                            )}
                          </div>
                          <div
                            onClick={() => setInspectingReport(r)}
                            className="font-semibold text-ink hover:text-primary cursor-pointer line-clamp-1 transition-colors"
                          >
                            {target?.title || `Item #${r.target_id.substring(0, 8)}`}
                          </div>
                          <p className="text-xs text-ink-muted line-clamp-2">
                            {target?.snippet || "No text preview"}
                          </p>
                        </div>
                      </td>

                      {/* Reason & Severity */}
                      <td className="p-4 max-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {r.severity === "CRITICAL" && (
                              <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[11px]">
                                Critical
                              </Badge>
                            )}
                            {r.severity === "HIGH_PRIORITY" && (
                              <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-[11px]">
                                High Priority
                              </Badge>
                            )}
                            {r.severity === "NORMAL" && (
                              <Badge
                                variant="outline"
                                className="border-sky-500/40 text-sky-600 bg-sky-500/10 text-[11px]"
                              >
                                Normal
                              </Badge>
                            )}
                            {r.severity === "LOW" && (
                              <Badge variant="outline" className="text-[11px]">
                                Low
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs font-medium text-ink">
                            {r.reason === "SPAM"
                              ? "Spam / Promotion"
                              : r.reason === "HARASSMENT"
                              ? "Harassment"
                              : r.reason === "INAPPROPRIATE_CONTENT"
                              ? "Inappropriate"
                              : r.reason === "CHEATING_ACADEMIC_DISHONESTY"
                              ? "Cheating"
                              : r.reason === "COPYRIGHT_VIOLATION"
                              ? "Copyright"
                              : r.reason}
                          </div>
                          {r.reason === "OTHER" && r.notes && (
                            <p className="text-[11px] text-ink-muted italic line-clamp-1" title={r.notes}>
                              &ldquo;{r.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Reporter */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {reporter?.id ? (
                              <Link
                                href={`/users/${reporter.id}`}
                                target="_blank"
                                className="text-xs font-semibold text-ink hover:text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <span>{reporter.display_name || "Unknown"}</span>
                                <ExternalLink className="size-2.5 text-ink-muted" />
                              </Link>
                            ) : (
                              <span className="text-xs font-semibold text-ink">
                                {reporter?.display_name || "Unknown"}
                              </span>
                            )}
                            {reporter && (
                              <ContributorBadge
                                tier={reporter.contributor_tier ?? 1}
                                size="sm"
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-ink-muted">
                            {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* Author / Offender */}
                      <td className="p-4 whitespace-nowrap">
                        {r.target_type === "USER" ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="border-rose-500/30 text-rose-600 bg-rose-500/10 text-[10px] font-semibold"
                              >
                                Account Target
                              </Badge>
                              {author?.role && (
                                <span className="text-[11px] text-ink-muted capitalize">
                                  {author.role.toLowerCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {author?.ban_status && author.ban_status !== "ACTIVE" ? (
                                <Badge variant="destructive" className="text-[10px] py-0 px-1">
                                  {author.ban_status}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-medium">
                                  Active
                                </span>
                              )}
                              <span className="text-[11px] text-ink-muted">
                                ({author?.lifetime_reports_received ?? 0} flags)
                              </span>
                            </div>
                          </div>
                        ) : author ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {author.id ? (
                                <Link
                                  href={`/users/${author.id}`}
                                  target="_blank"
                                  className="text-xs font-semibold text-ink hover:text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{author.display_name}</span>
                                  <ExternalLink className="size-2.5 text-ink-muted" />
                                </Link>
                              ) : (
                                <span className="text-xs font-semibold text-ink">
                                  {author.display_name}
                                </span>
                              )}
                              <ContributorBadge tier={author.contributor_tier ?? 1} size="sm" />
                            </div>
                            <div className="flex items-center gap-1">
                              {author.ban_status && author.ban_status !== "ACTIVE" ? (
                                <Badge variant="destructive" className="text-[10px] py-0 px-1">
                                  {author.ban_status}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-medium">
                                  Active
                                </span>
                              )}
                              <span className="text-[11px] text-ink-muted">
                                ({author.lifetime_reports_received ?? 0} flags)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Item Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInspectingReport(r)}
                            className="h-8 px-2.5 text-xs font-medium"
                            title={
                              r.target_type === "USER"
                                ? "Inspect reported user account profile"
                                : "Inspect reported item and formula derivations"
                            }
                          >
                            <Eye className="size-3.5 mr-1 text-primary" /> Inspect
                          </Button>

                          {/* Sanction button - identical UI across all target types */}
                          {author && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSanctionUser(author)}
                              className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                              title={
                                r.target_type === "USER"
                                  ? "Sanction / Warn User"
                                  : "Sanction / Warn Author"
                              }
                            >
                              <ShieldAlert className="size-4" />
                            </Button>
                          )}

                          {r.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: r.id, status: "DISMISSED" })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="h-8 px-2 text-xs text-ink-muted hover:text-ink"
                                title="Dismiss Report (No Violation)"
                              >
                                <XCircle className="size-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: r.id, status: "RESOLVED" })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700"
                                title="Resolve Report"
                              >
                                <CheckCircle2 className="size-4" />
                              </Button>

                              {r.target_type !== "USER" && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 px-2 text-xs"
                                        title="Takedown Content"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="w-44">
                                    {author && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => setSanctionUser(author)}
                                          className="text-amber-600 font-medium"
                                        >
                                          <ShieldAlert className="size-4 mr-2" /> Sanction Author
                                        </DropdownMenuItem>
                                        <div className="h-px bg-line my-1" />
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        takedownMutation.mutate({
                                          reportId: r.id,
                                          target_id: r.target_id,
                                          target_type: r.target_type,
                                          action: "soft_delete",
                                        })
                                      }
                                      className="text-destructive font-medium"
                                    >
                                      <Trash2 className="size-4 mr-2" /> Soft Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        takedownMutation.mutate({
                                          reportId: r.id,
                                          target_id: r.target_id,
                                          target_type: r.target_type,
                                          action: "hide",
                                        })
                                      }
                                    >
                                      <EyeOff className="size-4 mr-2" /> Hide Content
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        takedownMutation.mutate({
                                          reportId: r.id,
                                          target_id: r.target_id,
                                          target_type: r.target_type,
                                          action: "lock",
                                        })
                                      }
                                    >
                                      <Lock className="size-4 mr-2" /> Lock Content
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Batch Action Dock */}
      <ModerationBatchDock
        selectedIds={selectedReportIds}
        onClearSelection={() => setSelectedReportIds([])}
      />

      {/* Slide-over Content Inspector Drawer */}
      <ReportedItemInspector
        report={inspectingReport}
        isOpen={Boolean(inspectingReport)}
        onClose={() => setInspectingReport(null)}
      />

      {/* Manage Sanction Modal for Table Row Action */}
      {sanctionUser && (
        <ManageSanctionModal
          user={{
            id: sanctionUser.id,
            display_name: sanctionUser.display_name,
            email: sanctionUser.email || "",
            ban_status: (sanctionUser.ban_status as BanState) || "ACTIVE",
            ban_expires_at: sanctionUser.ban_expires_at || null,
          }}
          open={Boolean(sanctionUser)}
          onOpenChange={(open) => {
            if (!open) setSanctionUser(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["adminReports"] });
            queryClient.invalidateQueries({ queryKey: ["adminReportsCounts"] });
          }}
        />
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminReportsContent />
    </Suspense>
  );
}
