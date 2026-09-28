"use client";

import React, { useState } from "react";
import { ReportItem } from "@/types/moderation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/ui/math-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { BanCountdownBadge } from "./ban-countdown-badge";
import { ManageSanctionModal } from "./manage-sanction-modal";
import { BanState } from "@/types/user";
import {
  X,
  ExternalLink,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  EyeOff,
  Lock,
  User,
  FileText,
  HelpCircle,
  CheckCheck,
  BookOpen,
  MessageSquare,
  Paperclip,
  Clock,
  Quote,
} from "lucide-react";
import { StaffUserIntelDrawer } from "@/components/features/users/staff-user-intel-drawer";
import { StaffUserIntelButton } from "@/components/features/users/staff-user-intel-button";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ReportedItemInspectorProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export function ReportedItemInspector({
  report,
  isOpen,
  onClose,
  onStatusUpdated,
}: ReportedItemInspectorProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/reports/${id}/status/`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Report ${vars.status.toLowerCase()} successfully`);
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReportsCounts"] });
      onStatusUpdated?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update report status";
      toast.error(msg);
    },
  });

  const takedownMutation = useMutation({
    mutationFn: async ({
      target_id,
      target_type,
      action,
      reason,
    }: {
      target_id: string;
      target_type: string;
      action: string;
      reason: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/takedown/`, token, {
        method: "POST",
        body: JSON.stringify({ target_id, target_type, action, reason }),
      });
    },
    onSuccess: async (_, vars) => {
      toast.success(`Content ${vars.action} completed`);
      // Also resolve this report
      if (report?.id) {
        await updateStatusMutation.mutateAsync({ id: report.id, status: "RESOLVED" });
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to execute takedown";
      toast.error(msg);
    },
  });

  if (!isOpen || !report) return null;

  const target = report.target_details;
  const author = target?.author || (report.target_type === "USER" && target ? {
    id: report.target_id,
    display_name: target.display_name || target.title?.replace("User Profile: ", "") || "Reported User",
    email: target.email || "",
    role: target.role || "STUDENT",
    ban_status: target.ban_status || "ACTIVE",
    ban_expires_at: target.ban_expires_at || null,
    lifetime_reports_received: (target.lifetime_reports_received ?? target.author?.lifetime_reports_received) ?? 0,
    contributor_tier: target.contributor_tier ?? 1,
    profile_image_url: target.profile_image_url,
  } : target?.author);
  const reporter = report.reporter_details;

  const isPending = report.status === "PENDING";

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-semibold">Critical</Badge>;
      case "HIGH_PRIORITY":
        return <Badge className="bg-amber-600 hover:bg-amber-600 text-white font-semibold">High Priority</Badge>;
      case "NORMAL":
        return <Badge variant="outline" className="border-sky-500/40 text-sky-600 bg-sky-500/10 font-medium">Normal</Badge>;
      case "LOW":
        return <Badge variant="outline" className="border-border text-ink-muted font-normal">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  }

  function getReasonLabel(reason: string) {
    switch (reason) {
      case "SPAM":
        return "Spam or Commercial Promotion";
      case "HARASSMENT":
        return "Harassment or Abusive Behavior";
      case "INAPPROPRIATE_CONTENT":
        return "Inappropriate or Offensive Content";
      case "CHEATING_ACADEMIC_DISHONESTY":
        return "Cheating / Academic Dishonesty";
      case "COPYRIGHT_VIOLATION":
        return "Copyright Violation";
      case "OTHER":
        return "Other Policy Violation";
      default:
        return reason;
    }
  }

  function getTargetTypeIcon(type: string) {
    switch (type) {
      case "PROBLEM":
        return <HelpCircle className="size-4 text-amber-500" />;
      case "SOLUTION":
        return <CheckCheck className="size-4 text-emerald-500" />;
      case "POST":
        return <MessageSquare className="size-4 text-sky-500" />;
      case "LESSON":
        return <BookOpen className="size-4 text-indigo-500" />;
      case "COMMENT":
        return <Quote className="size-4 text-purple-500" />;
      case "USER":
        return <User className="size-4 text-rose-500" />;
      default:
        return <FileText className="size-4" />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-xs flex justify-end transition-opacity duration-300">
      <div
        className="w-full max-w-2xl bg-card border-l border-line h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-line text-xs font-semibold text-ink">
              {getTargetTypeIcon(report.target_type)}
              <span>{report.target_type}</span>
            </div>
            <div className="text-xs text-ink-muted">
              Report ID: <span className="font-mono text-ink">{report.id.substring(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {target?.url && (
              <a
                href={target.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2.5 py-1 rounded-md border border-line bg-card"
              >
                <span>Open Target</span>
                <ExternalLink className="size-3" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-muted transition-colors"
              aria-label="Close inspector"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Report Triage Box */}
          <div className="rounded-2xl border border-line bg-muted/20 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {getSeverityBadge(report.severity as string)}
                <Badge variant="outline" className="font-medium text-xs">
                  {getReasonLabel(report.reason as string)}
                </Badge>
              </div>
              <Badge
                variant={
                  report.status === "PENDING"
                    ? "default"
                    : report.status === "RESOLVED"
                    ? "outline"
                    : "secondary"
                }
                className={
                  report.status === "RESOLVED"
                    ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/10"
                    : ""
                }
              >
                {report.status}
              </Badge>
            </div>

            {/* Reporter details */}
            <div className="flex items-center justify-between gap-3 text-xs pt-3 border-t border-line/60">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">Reported by:</span>
                {reporter?.id ? (
                  <Link
                    href={`/users/${reporter.id}`}
                    target="_blank"
                    className="font-semibold text-ink hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{reporter.display_name || "Anonymous Reporter"}</span>
                    <ExternalLink className="size-3 text-ink-muted" />
                  </Link>
                ) : (
                  <span className="font-semibold text-ink">
                    {reporter?.display_name || "Anonymous Reporter"}
                  </span>
                )}
                {reporter && <ContributorBadge tier={reporter.contributor_tier ?? 1} size="sm" />}
              </div>
              <div className="flex items-center gap-1 text-ink-muted">
                <Clock className="size-3" />
                <span>{new Date(report.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Reporter Notes — strictly for custom 'OTHER' reasons */}
            {report.reason === "OTHER" && report.notes && (
              <div className="rounded-xl border border-line/80 bg-card p-3.5 text-xs">
                <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Reporter Description (&ldquo;Other&rdquo;):
                </span>
                <p className="text-ink italic leading-relaxed">&ldquo;{report.notes}&rdquo;</p>
              </div>
            )}
          </div>

          {/* 2. Reported Item Display */}
          {report.target_type === "USER" ? (
            /* Dedicated Reported Account Profile Summary */
            <div className="rounded-2xl border border-line bg-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                      Reported Account Profile
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ink leading-snug">
                    {author?.display_name || `User #${report.target_id.substring(0, 8)}`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {author && (
                    <>
                      <StaffUserIntelButton
                        userId={author.id}
                        profile={author}
                        variant="compact"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSanctionModalOpen(true)}
                        className="h-7 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1"
                      >
                        <ShieldAlert className="size-3.5 text-amber-500" />
                        Sanction User
                      </Button>
                    </>
                  )}
                  {author?.id && (
                    <Link
                      href={`/users/${author.id}`}
                      target="_blank"
                      className="h-8 px-3 rounded-lg border border-line bg-muted/40 hover:bg-muted text-xs font-semibold text-ink inline-flex items-center gap-1.5 transition-colors"
                    >
                      View Full Profile <ExternalLink className="size-3 text-ink-muted" />
                    </Link>
                  )}
                </div>
              </div>

              {/* User Details Box */}
              {author && (
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-line bg-muted/20">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="size-12">
                      {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                      <AvatarFallback className="text-sm font-bold bg-muted text-ink">
                        {author.display_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-ink">{author.display_name}</span>
                        <ContributorBadge tier={author.contributor_tier ?? 1} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <span>{author.email}</span>
                        <span>•</span>
                        <span className="font-mono">ID: {author.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {author.role}
                    </Badge>
                    {author.ban_status && author.ban_status !== "ACTIVE" ? (
                      author.ban_status === "BANNED_24H" || author.ban_status === "BANNED_7D" ? (
                        <BanCountdownBadge banStatus={author.ban_status} />
                      ) : (
                        <Badge variant="destructive" className="text-xs font-semibold">
                          {author.ban_status}
                        </Badge>
                      )
                    ) : (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs">
                        Active / Clean
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Forensic Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-line bg-muted/30 p-3">
                  <div className="text-xs text-ink-muted font-medium">Lifetime Reports</div>
                  <div className="text-xl font-bold text-ink mt-0.5">
                    {author?.lifetime_reports_received ?? 0}
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5">Across all content & profile</div>
                </div>
                <div className="rounded-xl border border-line bg-muted/30 p-3">
                  <div className="text-xs text-ink-muted font-medium">Contributor Standing</div>
                  <div className="text-sm font-bold text-ink mt-1.5">
                    Tier {author?.contributor_tier ?? 1}
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5">Community Rep</div>
                </div>
                <div className="rounded-xl border border-line bg-muted/30 p-3">
                  <div className="text-xs text-ink-muted font-medium">Disciplinary State</div>
                  <div className="text-sm font-semibold mt-1.5">
                    {author?.ban_status === "ACTIVE" ? (
                      <span className="text-emerald-600 font-bold">In Good Standing</span>
                    ) : (
                      <span className="text-rose-600 font-bold">{author?.ban_status}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5">Current Account Status</div>
                </div>
              </div>

              {/* Forensic Guidance Notice */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-600 shrink-0" />
                  Identity Moderation Target
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Reports against user profiles address account behavior, impersonation, or academic integrity. Sanction actions (Warning, Temporary Suspension, Ban) directly govern the user&apos;s authentication and access. Deep forensic telemetry (infraction radar, historical audit logs, and contribution point provenance) will be directly integrated here upon Phase 5 deployment.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Target Content Details */}
              <div className="rounded-2xl border border-line bg-card p-6 space-y-5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Target Content Details
                  </span>
                  <h3 className="text-lg font-bold text-ink leading-snug">
                    {target?.title || "Reported Item"}
                  </h3>
                </div>

                {/* Target Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {target?.subject && (
                    <Badge variant="outline" className="text-xs font-medium">
                      {target.subject.name} ({target.subject.code})
                    </Badge>
                  )}
                  {target?.level && (
                    <Badge variant="outline" className="text-xs font-medium">
                      {target.level.name}
                    </Badge>
                  )}
                  {target?.origin && (
                    <Badge variant="secondary" className="text-xs">
                      {target.origin}
                    </Badge>
                  )}
                  {target?.question_number && (
                    <Badge variant="secondary" className="text-xs font-mono font-bold">
                      Q{target.question_number}
                    </Badge>
                  )}
                  {target?.is_accepted && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs gap-1">
                      <CheckCircle2 className="size-3" /> Accepted Solution
                    </Badge>
                  )}
                  {target?.state && (
                    <Badge variant="outline" className="text-xs">
                      State: {target.state}
                    </Badge>
                  )}
                </div>

                {/* Parent Link if Solution or Comment */}
                {target?.parent_problem && (
                  <div className="rounded-xl border border-line bg-muted/30 p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-ink-muted font-medium">Parent Problem: </span>
                      <span className="font-semibold text-ink">{target.parent_problem.title}</span>
                    </div>
                    <a
                      href={`/problems/${target.parent_problem.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      View Problem <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}

                {/* Mathematical / LaTeX formula rendering for Problems and Solutions */}
                {(report.target_type === "PROBLEM" || report.target_type === "SOLUTION") && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Mathematical Content & LaTeX Derivations:
                    </span>
                    <div className="rounded-xl border border-line bg-muted/15 p-4 overflow-x-auto">
                      <MathRenderer content={target?.content_latex || target?.snippet || "No text provided"} />
                    </div>
                  </div>
                )}

                {/* Standard Markdown / Text preview for Posts, Lessons, Comments */}
                {report.target_type !== "PROBLEM" &&
                  report.target_type !== "SOLUTION" && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Content Body Preview:
                      </span>
                      <div className="rounded-xl border border-line bg-muted/15 p-4 text-sm text-ink whitespace-pre-wrap leading-relaxed">
                        {target?.content_markdown || target?.snippet || "No content body available."}
                      </div>
                    </div>
                  )}

                {/* Attachments Inspection */}
                {Boolean(target?.attachments && target.attachments.length > 0) && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Attachments ({target?.attachments?.length}):
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {target?.attachments?.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-line bg-card hover:bg-muted/40 transition-colors text-xs font-medium text-ink group"
                        >
                          <Paperclip className="size-4 text-brand shrink-0" />
                          <span className="truncate group-hover:underline">{att.name}</span>
                          <ExternalLink className="size-3 text-ink-muted ml-auto shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Attachment URL if post */}
                {target?.attachment_url && (
                  <div className="pt-2">
                    <a
                      href={target.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline p-2 rounded-lg border border-line bg-muted/20"
                    >
                      <Paperclip className="size-4" />
                      <span>{target.attachment_name || "Attached Media Document"}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* 3. Offender Forensic Intelligence Box */}
              {author && (
                <div className="rounded-2xl border border-line bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-4 text-warning" />
                      <span className="text-xs font-bold uppercase tracking-wider text-ink">
                        Author / Offender Intelligence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StaffUserIntelDrawer
                        userId={author.id}
                        profile={author}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1"
                          >
                            <Shield className="size-3.5 text-amber-500" />
                            Staff Intel
                          </Button>
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSanctionModalOpen(true)}
                        className="h-7 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1"
                      >
                        <ShieldAlert className="size-3.5 text-amber-500" />
                        Sanction Author
                      </Button>
                      <Link
                        href={`/users/${author.id}`}
                        target="_blank"
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View 360° Profile <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-line bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                        <AvatarFallback>{author.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink">{author.display_name}</span>
                          <ContributorBadge tier={author.contributor_tier ?? 1} size="sm" />
                        </div>
                        <span className="text-xs text-ink-muted">{author.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {author.role}
                      </Badge>
                      {author.ban_status && author.ban_status !== "ACTIVE" && (
                        author.ban_status === "BANNED_24H" || author.ban_status === "BANNED_7D" ? (
                          <BanCountdownBadge banStatus={author.ban_status} />
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            {author.ban_status}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl border border-line bg-muted/30 p-2.5">
                      <div className="text-xs text-ink-muted">Lifetime Reports Received</div>
                      <div className="text-lg font-bold text-ink mt-0.5">
                        {author.lifetime_reports_received ?? 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-line bg-muted/30 p-2.5">
                      <div className="text-xs text-ink-muted">Sanction Status</div>
                      <div className="text-sm font-semibold text-ink mt-1">
                        {author.ban_status === "ACTIVE" ? (
                          <span className="text-emerald-600">Clean / In Good Standing</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{author.ban_status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions Dock */}
        <div className="p-4 border-t border-line bg-muted/40 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {report.target_type === "USER" && author && (
              <>
                <StaffUserIntelDrawer
                  userId={author.id}
                  profile={author}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1 font-medium"
                    >
                      <Shield className="size-4 text-amber-500" /> Staff Intel
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSanctionModalOpen(true)}
                  className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1 font-medium"
                >
                  <ShieldAlert className="size-4 text-amber-500" /> Sanction User
                </Button>
              </>
            )}

            {isPending && (
              report.target_type === "USER" ? (
                <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-ink-muted hover:text-ink"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: report.id, status: "DISMISSED" })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="size-4 mr-1 text-ink-muted" /> Dismiss Report
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: report.id, status: "RESOLVED" })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="size-4 mr-1" /> Resolve Report
                    </Button>
                  </>
                ) : (
                <>
                  {author && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSanctionModalOpen(true)}
                      className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1 font-medium"
                    >
                      <ShieldAlert className="size-4 text-amber-500" /> Sanction Author
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-ink-muted hover:text-ink"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: report.id, status: "DISMISSED" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="size-4 mr-1 text-ink-muted" /> Dismiss Report
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={takedownMutation.isPending}
                        >
                          <Trash2 className="size-4 mr-1" /> Takedown Item
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() =>
                          takedownMutation.mutate({
                            target_id: report.target_id,
                            target_type: report.target_type,
                            action: "soft_delete",
                            reason: `Takedown via Report #${report.id.substring(0, 8)}`,
                          })
                        }
                        className="text-destructive font-medium"
                      >
                        <Trash2 className="size-4 mr-2" /> Soft Delete Item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          takedownMutation.mutate({
                            target_id: report.target_id,
                            target_type: report.target_type,
                            action: "hide",
                            reason: `Hidden via Report #${report.id.substring(0, 8)}`,
                          })
                        }
                      >
                        <EyeOff className="size-4 mr-2" /> Hide Content
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          takedownMutation.mutate({
                            target_id: report.target_id,
                            target_type: report.target_type,
                            action: "lock",
                            reason: `Locked via Report #${report.id.substring(0, 8)}`,
                          })
                        }
                      >
                        <Lock className="size-4 mr-2" /> Lock Content
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="default"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: report.id, status: "RESOLVED" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 className="size-4 mr-1" /> Resolve Report
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Manage Sanction Modal */}
      {author && (
        <ManageSanctionModal
          user={{
            id: author.id,
            display_name: author.display_name,
            email: author.email || "",
            ban_status: (author.ban_status as BanState) || "ACTIVE",
            ban_expires_at: author.ban_expires_at || null,
          }}
          open={sanctionModalOpen}
          onOpenChange={setSanctionModalOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
            if (onStatusUpdated) onStatusUpdated();
          }}
        />
      )}
    </div>
  );
}
