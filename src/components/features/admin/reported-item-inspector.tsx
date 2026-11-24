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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

  if (!report) return null;

  const target = report.target_details;
  const author = target?.author || (report.target_type === "USER" && target ? {
    id: report.target_id,
    display_name: target.display_name || target.title?.replace("User Profile: ", "") || "Reported User",
    email: target.email || "",
    role: target.role || "STUDENT",
    ban_status: target.ban_status || "ACTIVE",
    ban_expires_at: target.ban_expires_at || null,
    lifetime_reports_received: (target.lifetime_reports_received ?? target.author?.lifetime_reports_received) ?? 0,
    contributor_tier: target.contributor_tier ?? 0,
    profile_image_url: target.profile_image_url,
  } : target?.author);
  const reporter = report.reporter_details;

  const isPending = report.status === "PENDING";

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive" className="font-semibold">Critical</Badge>;
      case "HIGH_PRIORITY":
        return <Badge variant="warning" className="font-semibold">High Priority</Badge>;
      case "NORMAL":
        return <Badge variant="outline" className="border-chart-3/40 text-chart-3 bg-chart-3/10 font-medium">Normal</Badge>;
      case "LOW":
        return <Badge variant="outline" className="border-border text-muted-foreground font-normal">Low</Badge>;
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
        return <HelpCircle className="size-4 text-warning" aria-hidden="true" />;
      case "SOLUTION":
        return <CheckCheck className="size-4 text-primary" aria-hidden="true" />;
      case "POST":
        return <MessageSquare className="size-4 text-chart-3" aria-hidden="true" />;
      case "LESSON":
        return <BookOpen className="size-4 text-chart-4" aria-hidden="true" />;
      case "COMMENT":
        return <Quote className="size-4 text-tier-4" aria-hidden="true" />;
      case "USER":
        return <User className="size-4 text-destructive" aria-hidden="true" />;
      default:
        return <FileText className="size-4" aria-hidden="true" />;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-0 right-0 left-auto bottom-0 translate-x-0 translate-y-0 h-full w-full max-w-2xl sm:max-w-2xl rounded-none border-l border-border bg-card p-0 gap-0 shadow-modal flex flex-col overflow-hidden data-open:slide-in-from-right data-closed:slide-out-to-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground">
              {getTargetTypeIcon(report.target_type)}
              <span>{report.target_type}</span>
            </div>
            <div>
              <DialogTitle className="text-xs font-semibold text-foreground">
                Report Inspector
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Report ID: <span className="font-mono text-foreground">{report.id.substring(0, 8)}</span>
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {target?.url && (
              <a
                href={target.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2.5 py-1.5 rounded-md border border-border bg-card"
              >
                <span>Open Target</span>
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-[32px] md:min-w-[32px] p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close inspector"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Report Triage Box */}
          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
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
                    ? "border-primary/50 text-primary bg-primary/10"
                    : ""
                }
              >
                {report.status}
              </Badge>
            </div>

            {/* Reporter details */}
            <div className="flex items-center justify-between gap-3 text-xs pt-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Reported by:</span>
                {reporter?.id ? (
                  <Link
                    href={`/users/${reporter.id}`}
                    target="_blank"
                    className="font-semibold text-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{reporter.display_name || "Anonymous Reporter"}</span>
                    <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">
                    {reporter?.display_name || "Anonymous Reporter"}
                  </span>
                )}
                {reporter && <ContributorBadge tier={reporter.contributor_tier ?? 1} size="sm" />}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3" aria-hidden="true" />
                <span>{new Date(report.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Reporter Notes — strictly for custom 'OTHER' reasons */}
            {report.reason === "OTHER" && report.notes && (
              <div className="rounded-xl border border-border/80 bg-card p-3.5 text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Reporter Description (&ldquo;Other&rdquo;):
                </span>
                <p className="text-foreground italic leading-relaxed">&ldquo;{report.notes}&rdquo;</p>
              </div>
            )}
          </div>

          {/* 2. Reported Item Display */}
          {report.target_type === "USER" ? (
            /* Dedicated Reported Account Profile Summary */
            <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-destructive" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wider text-destructive">
                      Reported Account Profile
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground leading-snug">
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
                        className="h-8 text-xs font-semibold text-warning border-warning/30 hover:bg-warning/10 gap-1"
                      >
                        <ShieldAlert className="size-3.5 text-warning" aria-hidden="true" />
                        Sanction User
                      </Button>
                    </>
                  )}
                  {author?.id && (
                    <Link
                      href={`/users/${author.id}`}
                      target="_blank"
                      className="h-8 px-3 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors"
                    >
                      View Full Profile <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>

              {/* User Details Box */}
              {author && (
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="size-12">
                      {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                      <AvatarFallback className="text-sm font-bold bg-muted text-foreground">
                        {author.display_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">{author.display_name}</span>
                        <ContributorBadge tier={author.contributor_tier ?? 1} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                      <Badge variant="default" className="text-xs">
                        Active / Clean
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Forensic Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground font-medium">Lifetime Reports</div>
                  <div className="font-mono tabular-nums text-xl font-bold text-foreground mt-0.5">
                    {author?.lifetime_reports_received ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Across all content & profile</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground font-medium">Contributor Standing</div>
                  <div className="font-mono tabular-nums text-sm font-bold text-foreground mt-1.5">
                    Tier {author?.contributor_tier ?? 1}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Community Rep</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground font-medium">Disciplinary State</div>
                  <div className="text-sm font-semibold mt-1.5">
                    {author?.ban_status === "ACTIVE" ? (
                      <span className="text-primary font-bold">In Good Standing</span>
                    ) : (
                      <span className="text-destructive font-bold">{author?.ban_status}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Current Account Status</div>
                </div>
              </div>

              {/* Forensic Guidance Notice */}
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-foreground space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-warning">
                  <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
                  Identity Moderation Target
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Reports against user profiles address account behavior, impersonation, or academic integrity. Sanction actions (Warning, Temporary Suspension, Ban) directly govern the user&apos;s authentication and access. Deep forensic telemetry (infraction radar, historical audit logs, and contribution point provenance) will be directly integrated here upon Phase 5 deployment.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Target Content Details */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target Content Details
                  </span>
                  <h3 className="text-lg font-bold text-foreground leading-snug">
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
                  {typeof target?.vote_score === "number" && (
                    <Badge variant="outline" className="text-xs font-mono tabular-nums">
                      Score: {target.vote_score >= 0 ? "+" : ""}
                      {target.vote_score}
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
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground font-medium">Parent Problem: </span>
                      <span className="font-semibold text-foreground">{target.parent_problem.title}</span>
                      {typeof target.parent_problem.resolution_confidence === "number" && (
                        <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
                          {Math.round(target.parent_problem.resolution_confidence)}% conf.
                        </Badge>
                      )}
                    </div>
                    <a
                      href={`/problems/${target.parent_problem.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      View Problem <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  </div>
                )}

                {/* Mathematical / LaTeX formula rendering for Problems and Solutions */}
                {(report.target_type === "PROBLEM" || report.target_type === "SOLUTION") && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Mathematical Content & LaTeX Derivations:
                    </span>
                    <div className="rounded-xl border border-border bg-muted/15 p-4 overflow-x-auto">
                      <MathRenderer content={target?.content_latex || target?.snippet || "No text provided"} />
                    </div>
                  </div>
                )}

                {/* Standard Markdown / Text preview for Posts, Lessons, Comments */}
                {report.target_type !== "PROBLEM" &&
                  report.target_type !== "SOLUTION" && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Content Body Preview:
                      </span>
                      <div className="rounded-xl border border-border bg-muted/15 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {target?.content_markdown || target?.snippet || "No content body available."}
                      </div>
                    </div>
                  )}

                {/* Attachments Inspection */}
                {Boolean(target?.attachments && target.attachments.length > 0) && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attachments ({target?.attachments?.length}):
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {target?.attachments?.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-xs font-medium text-foreground group"
                        >
                          <Paperclip className="size-4 text-primary shrink-0" aria-hidden="true" />
                          <span className="truncate group-hover:underline">{att.name}</span>
                          <ExternalLink className="size-3 text-muted-foreground ml-auto shrink-0" aria-hidden="true" />
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
                      className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline p-2 rounded-lg border border-border bg-muted/20"
                    >
                      <Paperclip className="size-4" aria-hidden="true" />
                      <span>{target.attachment_name || "Attached Media Document"}</span>
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>

              {/* 3. Offender Forensic Intelligence Box */}
              {author && (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-4 text-warning" aria-hidden="true" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Author / Offender Intelligence
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StaffUserIntelDrawer
                        userId={author.id}
                        profile={author}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold text-warning border-warning/30 hover:bg-warning/10 gap-1"
                          >
                            <Shield className="size-3.5 text-warning" aria-hidden="true" />
                            Staff Intel
                          </Button>
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSanctionModalOpen(true)}
                        className="h-8 text-xs font-semibold text-warning border-warning/30 hover:bg-warning/10 gap-1"
                      >
                        <ShieldAlert className="size-3.5 text-warning" aria-hidden="true" />
                        Sanction Author
                      </Button>
                      <Link
                        href={`/users/${author.id}`}
                        target="_blank"
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View 360° Profile <ExternalLink className="size-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                        <AvatarFallback>{author.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{author.display_name}</span>
                          <ContributorBadge tier={author.contributor_tier ?? 1} size="sm" />
                        </div>
                        <span className="text-xs text-muted-foreground">{author.email}</span>
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
                    <div className="rounded-xl border border-border bg-muted/30 p-2.5">
                      <div className="text-xs text-muted-foreground">Lifetime Reports Received</div>
                      <div className="font-mono tabular-nums text-lg font-bold text-foreground mt-0.5">
                        {author.lifetime_reports_received ?? 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-2.5">
                      <div className="text-xs text-muted-foreground">Sanction Status</div>
                      <div className="text-sm font-semibold text-foreground mt-1">
                        {author.ban_status === "ACTIVE" ? (
                          <span className="text-primary">Clean / In Good Standing</span>
                        ) : (
                          <span className="text-destructive font-bold">{author.ban_status}</span>
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
        <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            {report.target_type === "USER" && author && (
              <>
                <StaffUserIntelDrawer
                  userId={author.id}
                  profile={author}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-warning border-warning/30 hover:bg-warning/10 gap-1 font-medium"
                    >
                      <Shield className="size-4 text-warning" aria-hidden="true" /> Staff Intel
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSanctionModalOpen(true)}
                  className="text-warning border-warning/30 hover:bg-warning/10 gap-1 font-medium"
                >
                  <ShieldAlert className="size-4 text-warning" aria-hidden="true" /> Sanction User
                </Button>
              </>
            )}

            {isPending && (
              report.target_type === "USER" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: report.id, status: "DISMISSED" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="size-4 mr-1 text-muted-foreground" aria-hidden="true" /> Dismiss Report
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: report.id, status: "RESOLVED" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 className="size-4 mr-1" aria-hidden="true" /> Resolve Report
                  </Button>
                </>
              ) : (
                <>
                  {author && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSanctionModalOpen(true)}
                      className="text-warning border-warning/30 hover:bg-warning/10 gap-1 font-medium"
                    >
                      <ShieldAlert className="size-4 text-warning" aria-hidden="true" /> Sanction Author
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: report.id, status: "DISMISSED" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="size-4 mr-1 text-muted-foreground" aria-hidden="true" /> Dismiss Report
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={takedownMutation.isPending}
                        >
                          <Trash2 className="size-4 mr-1" aria-hidden="true" /> Takedown Item
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
                        <Trash2 className="size-4 mr-2" aria-hidden="true" /> Soft Delete Item
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
                        <EyeOff className="size-4 mr-2" aria-hidden="true" /> Hide Content
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
                        <Lock className="size-4 mr-2" aria-hidden="true" /> Lock Content
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: report.id, status: "RESOLVED" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 className="size-4 mr-1" aria-hidden="true" /> Resolve Report
                  </Button>
                </>
              )
            )}
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
      </DialogContent>
    </Dialog>
  );
}
