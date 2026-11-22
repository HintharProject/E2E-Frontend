"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  ShieldAlert,
  BarChart3,
  FileText,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  BookOpen,
  MessageSquare,
  Layers,
  ExternalLink,
  X,
  RotateCcw,
} from "lucide-react";
import { useModAnalytics } from "@/hooks/use-mod-analytics";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BanCountdownBadge } from "@/components/features/admin/ban-countdown-badge";
import { ManageSanctionModal } from "@/components/features/admin/manage-sanction-modal";
import { PointAdjustmentModal } from "@/components/features/admin/point-adjustment-modal";
import { ChangeRoleModal } from "@/components/features/admin/change-role-modal";
import { formatDate, cn } from "@/lib/utils";
import { isAdminOrSuperAdmin } from "@/types/user";
import type { UserPublic } from "@/types";
import type { RoleEnum, BanState } from "@/types/user";
import type { ContributorTier } from "@/types/contribution";

// ─── Risk Badge ────────────────────────────────────────────────────────────────
function RiskBadge({ rating }: { rating: "LOW" | "ELEVATED" | "HIGH_RISK" }) {
  if (rating === "HIGH_RISK") {
    return (
      <Badge className="bg-destructive/15 border border-destructive/40 text-destructive font-bold text-xs px-2.5 py-0.5">
        <ShieldAlert className="size-3 mr-1" aria-hidden="true" /> HIGH RISK
      </Badge>
    );
  }
  if (rating === "ELEVATED") {
    return (
      <Badge className="bg-warning/15 border border-warning/40 text-warning font-bold text-xs px-2.5 py-0.5">
        <AlertTriangle className="size-3 mr-1" aria-hidden="true" /> ELEVATED
      </Badge>
    );
  }
  return (
    <Badge className="bg-primary/15 border border-primary/40 text-primary font-bold text-xs px-2.5 py-0.5">
      <CheckCircle2 className="size-3 mr-1" aria-hidden="true" /> LOW RISK
    </Badge>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "red" | "amber" | "green" | "blue" | "default";
}) {
  const accentClass = {
    red: "border-destructive/30 bg-destructive/5 text-destructive",
    amber: "border-warning/30 bg-warning/5 text-warning",
    green: "border-primary/30 bg-primary/5 text-primary",
    blue: "border-chart-3/30 bg-chart-3/5 text-chart-3",
    default: "border-border bg-card text-foreground",
  }[accent ?? "default"];

  return (
    <div className={`rounded-xl border p-3 ${accentClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="font-mono text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="size-3.5 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
    </div>
  );
}

// ─── Main Drawer ───────────────────────────────────────────────────────────────
export interface StaffUserIntelDrawerProps {
  userId: string;
  /** Passed to embedded operation modals */
  profile:
    | UserPublic
    | {
        id: string;
        display_name: string;
        email?: string;
        role?: RoleEnum | string | null;
        ban_status?: BanState | string | null;
        ban_expires_at?: string | null;
        contributor_tier?: ContributorTier | number | null;
        contribution_points?: number;
      };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onActionSuccess?: () => void;
}

export function StaffUserIntelDrawer({
  userId,
  profile,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onActionSuccess,
}: StaffUserIntelDrawerProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [activeTab, setActiveTab] = useState<"infractions" | "sanctions" | "provenance" | "footprint">("infractions");
  const [sanctionOpen, setSanctionOpen] = useState(false);
  const [initialSanctionStatus, setInitialSanctionStatus] = useState<BanState | undefined>(undefined);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const { user: currentUser } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useModAnalytics(open ? userId : null);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["mod-analytics", userId] });
    onActionSuccess?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Trigger Button if not controlled externally */}
        {!isControlled && (
          trigger ? (
            <DialogTrigger
              render={
                React.isValidElement(trigger) ? (
                  trigger
                ) : (
                  <button type="button">{trigger}</button>
                )
              }
            />
          ) : (
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 text-xs font-semibold"
                  id="staff-intel-trigger"
                >
                  <Shield className="size-3.5 mr-1.5" aria-hidden="true" />
                  Staff Intel
                </Button>
              }
            />
          )
        )}

        <DialogContent
          showCloseButton={false}
          className="top-0 right-0 left-auto bottom-0 translate-x-0 translate-y-0 h-full w-full max-w-xl sm:max-w-xl rounded-none border-l border-border bg-card p-0 gap-0 shadow-modal flex flex-col overflow-hidden data-open:slide-in-from-right data-closed:slide-out-to-right duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-xl bg-warning/15 border border-warning/30 flex items-center justify-center shrink-0">
                <Shield className="size-4 text-warning" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-bold text-foreground">Staff Intel</DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground font-medium truncate">
                  {profile.display_name}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data && <RiskBadge rating={data.risk_rating} />}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-[32px] md:min-w-[32px] p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close Staff Intel drawer"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Staff intel sections"
            className="flex items-center gap-1 border-b border-border bg-muted/20 px-4 py-1.5 shrink-0 overflow-x-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "infractions"}
              onClick={() => setActiveTab("infractions")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 min-h-[36px] md:min-h-0 rounded-lg transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "infractions"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <ShieldAlert className="size-3.5" aria-hidden="true" /> Infractions
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "sanctions"}
              onClick={() => setActiveTab("sanctions")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 min-h-[36px] md:min-h-0 rounded-lg transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "sanctions"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <FileText className="size-3.5" aria-hidden="true" /> Sanctions
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "provenance"}
              onClick={() => setActiveTab("provenance")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 min-h-[36px] md:min-h-0 rounded-lg transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "provenance"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Coins className="size-3.5" aria-hidden="true" /> Points
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "footprint"}
              onClick={() => setActiveTab("footprint")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 min-h-[36px] md:min-h-0 rounded-lg transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "footprint"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Layers className="size-3.5" aria-hidden="true" /> Content
            </button>
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="size-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Failed to load staff intelligence</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Could not retrieve analytical forensic records for this user.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs gap-1.5">
                <RotateCcw className="size-3.5" aria-hidden="true" /> Retry
              </Button>
            </div>
          ) : data ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* ── Tab 1: Infractions & Risk ───────────────────────────── */}
              {activeTab === "infractions" && (
                <div className="space-y-5" role="tabpanel">
                  <SectionHeader icon={BarChart3} title="Infraction & Risk Radar" />

                  {/* Active Ban Banner with Live Countdown */}
                  {data.ban_status !== "ACTIVE" && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Active Penalty</p>
                        <p className="text-sm font-bold text-destructive">{data.ban_status.replace(/_/g, " ")}</p>
                      </div>
                      <BanCountdownBadge
                        banStatus={(data.ban_status as BanState) || "ACTIVE"}
                        banExpiresAt={data.ban_expires_at}
                        onExpire={() => queryClient.invalidateQueries({ queryKey: ["mod-analytics", userId] })}
                      />
                    </div>
                  )}

                  {/* Risk overview stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard
                      label="Lifetime"
                      value={data.reports_summary.lifetime_reports_count}
                      sub="total reports"
                      accent={data.reports_summary.lifetime_reports_count >= 7 ? "red" : data.reports_summary.lifetime_reports_count >= 3 ? "amber" : "green"}
                    />
                    <StatCard
                      label="Upheld"
                      value={data.reports_summary.upheld_reports_count}
                      sub="resolved against"
                      accent={data.reports_summary.upheld_reports_count >= 5 ? "red" : "default"}
                    />
                    <StatCard
                      label="Pending"
                      value={data.reports_summary.pending_reports_count}
                      sub="under review"
                      accent={data.reports_summary.pending_reports_count > 0 ? "amber" : "default"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Direct Profile Reports" value={data.reports_summary.direct_profile_reports} />
                    <StatCard label="Content Reports" value={data.reports_summary.authored_content_reports} />
                  </div>

                  {/* Infractions by Reason */}
                  {Object.keys(data.reports_summary.by_reason).length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Reports by Reason</p>
                      <div className="space-y-2">
                        {Object.entries(data.reports_summary.by_reason)
                          .sort(([, a], [, b]) => b - a)
                          .map(([reason, count]) => (
                            <div key={reason} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-foreground">{reason.replace(/_/g, " ")}</span>
                                <Badge variant="secondary" className="font-mono text-[10px] font-bold px-1.5 py-0 tabular-nums">
                                  {count}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 2: Sanctions Ledger ─────────────────────────────── */}
              {activeTab === "sanctions" && (
                <div className="space-y-4" role="tabpanel">
                  <SectionHeader icon={FileText} title="Sanction Ledger & Disciplinary Trail" />

                  {/* Active Penalty Tracker in Sanctions tab */}
                  {data.ban_status !== "ACTIVE" && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Active Suspension</p>
                        <p className="text-sm font-bold text-destructive">{data.ban_status.replace(/_/g, " ")}</p>
                      </div>
                      <BanCountdownBadge
                        banStatus={(data.ban_status as BanState) || "ACTIVE"}
                        banExpiresAt={data.ban_expires_at}
                        onExpire={() => queryClient.invalidateQueries({ queryKey: ["mod-analytics", userId] })}
                      />
                    </div>
                  )}

                  {data.sanctions_history.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-6 text-center">
                      <CheckCircle2 className="size-8 text-primary mx-auto mb-2" aria-hidden="true" />
                      <p className="text-sm font-medium text-foreground">No sanctions on record</p>
                      <p className="text-xs text-muted-foreground mt-1">This user has a clean disciplinary history.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.sanctions_history.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-xl border border-border bg-card p-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-foreground font-mono tracking-tight">
                              {log.action.replace(/_/g, " ")}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          {log.reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{log.reason}&rdquo;</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
                            <span>Issued by: <strong className="text-foreground">{log.admin_name}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 3: Points Provenance ────────────────────────────── */}
              {activeTab === "provenance" && (
                <div className="space-y-4" role="tabpanel">
                  <SectionHeader icon={Coins} title="Contribution Points Provenance" />

                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Net Balance"
                      value={data.contribution_provenance.total_net_points.toLocaleString()}
                      sub="current balance"
                      accent="blue"
                    />
                    <StatCard
                      label="Tier"
                      value={`T${data.contribution_provenance.contributor_tier}`}
                      sub={`Contributor Tier ${data.contribution_provenance.contributor_tier}`}
                    />
                  </div>

                  {/* Breakdown */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Points by Source</p>
                    <div className="space-y-2">
                      {Object.entries(data.contribution_provenance.breakdown)
                        .filter(([, v]) => v !== 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([source, pts]) => (
                          <div key={source} className="flex items-center justify-between">
                            <span className="text-xs text-foreground">{source.replace(/_/g, " ")}</span>
                            <span className={`font-mono text-xs font-bold tabular-nums ${pts < 0 ? "text-destructive" : "text-primary"}`}>
                              {pts > 0 ? "+" : ""}{pts}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent transactions */}
                  {data.contribution_provenance.recent_transactions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Recent Transactions</p>
                      <div className="space-y-1.5">
                        {data.contribution_provenance.recent_transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                          >
                            <div>
                              <p className="text-[11px] font-medium text-foreground">{tx.event_type.replace(/_/g, " ")}</p>
                              <p className="text-[10px] text-muted-foreground">{formatDate(tx.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-mono text-sm font-bold tabular-nums ${tx.delta < 0 ? "text-destructive" : "text-primary"}`}>
                                {tx.delta > 0 ? "+" : ""}{tx.delta}
                              </p>
                              <p className="font-mono text-[10px] text-muted-foreground tabular-nums">{tx.resulting_balance} total</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 4: Content Footprint ────────────────────────────── */}
              {activeTab === "footprint" && (
                <div className="space-y-4" role="tabpanel">
                  <SectionHeader icon={Layers} title="Content Footprint & Activity" />

                  <div className="space-y-3">
                    {/* Posts */}
                    <FootprintRow
                      icon={MessageSquare}
                      label="Forum Posts"
                      total={data.content_footprint.posts.total}
                      hidden={data.content_footprint.posts.hidden ?? 0}
                      deleted={data.content_footprint.posts.deleted ?? 0}
                      jumpUrl={`/forum`}
                    />
                    {/* Problems */}
                    <FootprintRow
                      icon={BarChart3}
                      label="Problems"
                      total={data.content_footprint.problems.total}
                      hidden={data.content_footprint.problems.hidden ?? 0}
                      deleted={data.content_footprint.problems.deleted ?? 0}
                      jumpUrl={`/problems`}
                    />
                    {/* Solutions */}
                    <FootprintRow
                      icon={CheckCircle2}
                      label="Solutions"
                      total={data.content_footprint.solutions.total ?? 0}
                      hidden={data.content_footprint.solutions.hidden ?? 0}
                      deleted={data.content_footprint.solutions.deleted ?? 0}
                      jumpUrl={`/users/${userId}`}
                    />
                    {/* Lessons */}
                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="size-4 text-primary" aria-hidden="true" />
                        <p className="text-xs font-bold text-foreground">Lessons</p>
                        <Badge variant="secondary" className="ml-auto font-mono tabular-nums text-[11px] font-bold px-2 py-0">
                          {data.content_footprint.lessons.total} total
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono tabular-nums">
                          <span className="flex items-center gap-1">
                            <Eye className="size-3 text-primary" aria-hidden="true" />
                            {data.content_footprint.lessons.published} published
                          </span>
                          <span className="flex items-center gap-1">
                            <EyeOff className="size-3 text-muted-foreground" aria-hidden="true" />
                            {data.content_footprint.lessons.draft} draft
                          </span>
                        </div>
                        <a
                          href={`/learning`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        >
                          <span>Browse</span>
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                    {/* Comments */}
                    <FootprintRow
                      icon={MessageSquare}
                      label="Comments"
                      total={data.content_footprint.comments.total ?? 0}
                      hidden={data.content_footprint.comments.hidden ?? 0}
                      deleted={data.content_footprint.comments.deleted ?? 0}
                      jumpUrl={`/users/${userId}`}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* ── Embedded Operations Dock ─────────────────────────────────── */}
          <div className="shrink-0 border-t border-border bg-card px-5 py-3 flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mr-1">Actions</p>

            {/* Direct Warn Trigger */}
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-warning/30 text-warning hover:bg-warning/10"
              onClick={() => {
                setInitialSanctionStatus("WARNING");
                setSanctionOpen(true);
              }}
            >
              <AlertTriangle className="size-3 mr-1" aria-hidden="true" /> Warn
            </Button>

            {/* Direct Sanction Trigger */}
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => {
                setInitialSanctionStatus(undefined);
                setSanctionOpen(true);
              }}
            >
              <ShieldAlert className="size-3 mr-1" aria-hidden="true" /> Sanction
            </Button>

            {/* Admin/SuperAdmin Operations strictly gated */}
            {isAdminOrSuperAdmin(currentUser?.role) && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setPointsOpen(true)}
                >
                  <Coins className="size-3 mr-1 text-warning" aria-hidden="true" /> Points
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setRoleOpen(true)}
                >
                  <Shield className="size-3 mr-1 text-primary" aria-hidden="true" /> Role
                </Button>
              </>
            )}

            <a
              href={`/users/${userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto"
            >
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                <ExternalLink className="size-3 mr-1" aria-hidden="true" /> Profile
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded modals */}
      <ManageSanctionModal
        user={{
          id: userId,
          display_name: profile.display_name,
          email: profile.email,
          ban_status: (profile.ban_status as BanState) || "ACTIVE",
          ban_expires_at: profile.ban_expires_at,
        }}
        open={sanctionOpen}
        onOpenChange={setSanctionOpen}
        initialStatus={initialSanctionStatus}
        onSuccess={handleSuccess}
      />
      <PointAdjustmentModal
        user={{
          id: userId,
          display_name: profile.display_name,
          contributor_tier: (profile.contributor_tier as ContributorTier) ?? null,
          contribution_points:
            profile.contribution_points ?? (data?.contribution_provenance?.total_net_points ?? 0),
        }}
        open={pointsOpen}
        onOpenChange={setPointsOpen}
      />
      <ChangeRoleModal
        user={{
          id: userId,
          display_name: profile.display_name,
          email: profile.email,
          role: (profile.role as RoleEnum) || "USER",
        }}
        isActorSuperAdmin={currentUser?.role === "SUPERADMIN"}
        open={roleOpen}
        onOpenChange={setRoleOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// ─── Helper: Footprint Row ─────────────────────────────────────────────────────
function FootprintRow({
  icon: Icon,
  label,
  total,
  hidden,
  deleted,
  jumpUrl,
}: {
  icon: React.ElementType;
  label: string;
  total: number;
  hidden: number;
  deleted: number;
  jumpUrl?: string;
}) {
  const active = total - hidden - deleted;
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        <p className="text-xs font-bold text-foreground">{label}</p>
        <Badge variant="secondary" className="ml-auto font-mono tabular-nums text-[11px] font-bold px-2 py-0">
          {total} total
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono tabular-nums">
          <span className="flex items-center gap-1">
            <Eye className="size-3 text-primary" aria-hidden="true" />
            {active >= 0 ? active : 0} active
          </span>
          {hidden > 0 && (
            <span className="flex items-center gap-1">
              <EyeOff className="size-3 text-warning" aria-hidden="true" />
              {hidden} hidden
            </span>
          )}
          {deleted > 0 && (
            <span className="flex items-center gap-1">
              <Trash2 className="size-3 text-destructive" aria-hidden="true" />
              {deleted} deleted
            </span>
          )}
        </div>
        {jumpUrl && (
          <a
            href={jumpUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <span>Browse</span>
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}

