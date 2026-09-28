"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
      <Badge className="bg-red-500/15 border border-red-500/40 text-red-500 font-bold text-xs px-2.5 py-0.5">
        <ShieldAlert className="size-3 mr-1" /> HIGH RISK
      </Badge>
    );
  }
  if (rating === "ELEVATED") {
    return (
      <Badge className="bg-amber-500/15 border border-amber-500/40 text-amber-500 font-bold text-xs px-2.5 py-0.5">
        <AlertTriangle className="size-3 mr-1" /> ELEVATED
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 font-bold text-xs px-2.5 py-0.5">
      <CheckCircle2 className="size-3 mr-1" /> LOW RISK
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
    red: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    green: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    default: "border-line bg-card text-ink",
  }[accent ?? "default"];

  return (
    <div className={`rounded-xl border p-3 ${accentClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-0.5">{label}</p>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-ink-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="size-3.5 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-ink tracking-tight">{title}</h3>
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
      {/* Trigger Button if not controlled externally */}
      {!isControlled && (
        trigger ? (
          <div onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
            {trigger}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 text-xs font-semibold"
            onClick={() => setOpen(true)}
            id="staff-intel-trigger"
          >
            <Shield className="size-3.5 mr-1.5" />
            Staff Intel
          </Button>
        )
      )}

      {open && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-xs flex justify-end transition-opacity duration-300">
          <div
            className="w-full max-w-xl bg-card border-l border-line h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-card/60 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Shield className="size-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink">Staff Intel</h2>
                  <p className="text-[11px] text-ink-muted font-medium">{profile.display_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data && <RiskBadge rating={data.risk_rating} />}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-muted transition-colors ml-2"
                  aria-label="Close drawer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-line bg-card/50 px-4 py-1.5 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("infractions")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0",
                  activeTab === "infractions"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-muted/50"
                )}
              >
                <ShieldAlert className="size-3.5" /> Infractions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sanctions")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0",
                  activeTab === "sanctions"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-muted/50"
                )}
              >
                <FileText className="size-3.5" /> Sanctions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("provenance")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0",
                  activeTab === "provenance"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-muted/50"
                )}
              >
                <Coins className="size-3.5" /> Points
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("footprint")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0",
                  activeTab === "footprint"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-muted/50"
                )}
              >
                <Layers className="size-3.5" /> Content
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
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Failed to load staff intelligence</p>
                  <p className="text-xs text-ink-muted mt-1 max-w-xs">
                    Could not retrieve analytical forensic records for this user.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs gap-1.5">
                  <RotateCcw className="size-3.5" /> Retry
                </Button>
              </div>
            ) : data ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* ── Tab 1: Infractions & Risk ───────────────────────────── */}
                {activeTab === "infractions" && (
                  <div className="space-y-5">
                    <SectionHeader icon={BarChart3} title="Infraction & Risk Radar" />

                    {/* Active Ban Banner with Live Countdown */}
                    {data.ban_status !== "ACTIVE" && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-0.5">Active Penalty</p>
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
                      <div className="rounded-xl border border-line bg-card p-4 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-2">Reports by Reason</p>
                        <div className="space-y-2">
                          {Object.entries(data.reports_summary.by_reason)
                            .sort(([, a], [, b]) => b - a)
                            .map(([reason, count]) => (
                              <div key={reason} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-ink">{reason.replace(/_/g, " ")}</span>
                                  <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 tabular-nums">
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
                  <div className="space-y-4">
                    <SectionHeader icon={FileText} title="Sanction Ledger & Disciplinary Trail" />

                    {/* Active Penalty Tracker in Sanctions tab */}
                    {data.ban_status !== "ACTIVE" && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-0.5">Active Suspension</p>
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
                      <div className="rounded-xl border border-line bg-card p-6 text-center">
                        <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-ink">No sanctions on record</p>
                        <p className="text-xs text-ink-muted mt-1">This user has a clean disciplinary history.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.sanctions_history.map((log) => (
                          <div
                            key={log.id}
                            className="rounded-xl border border-line bg-card p-3.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-ink font-mono tracking-tight">
                                {log.action.replace(/_/g, " ")}
                              </p>
                              <span className="text-[10px] text-ink-muted shrink-0 mt-0.5">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                            {log.reason && (
                              <p className="text-xs text-ink-muted mt-1 italic">&ldquo;{log.reason}&rdquo;</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-line text-[10px] text-ink-muted">
                              <span>Issued by: <strong className="text-ink">{log.admin_name}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab 3: Points Provenance ────────────────────────────── */}
                {activeTab === "provenance" && (
                  <div className="space-y-4">
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
                    <div className="rounded-xl border border-line bg-card p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-3">Points by Source</p>
                      <div className="space-y-2">
                        {Object.entries(data.contribution_provenance.breakdown)
                          .filter(([, v]) => v !== 0)
                          .sort(([, a], [, b]) => b - a)
                          .map(([source, pts]) => (
                            <div key={source} className="flex items-center justify-between">
                              <span className="text-xs text-ink">{source.replace(/_/g, " ")}</span>
                              <span className={`text-xs font-bold tabular-nums ${pts < 0 ? "text-destructive" : "text-emerald-500"}`}>
                                {pts > 0 ? "+" : ""}{pts}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Recent transactions */}
                    {data.contribution_provenance.recent_transactions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-2">Recent Transactions</p>
                        <div className="space-y-1.5">
                          {data.contribution_provenance.recent_transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2"
                            >
                              <div>
                                <p className="text-[11px] font-medium text-ink">{tx.event_type.replace(/_/g, " ")}</p>
                                <p className="text-[10px] text-ink-muted">{formatDate(tx.created_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold tabular-nums ${tx.delta < 0 ? "text-destructive" : "text-emerald-500"}`}>
                                  {tx.delta > 0 ? "+" : ""}{tx.delta}
                                </p>
                                <p className="text-[10px] text-ink-muted tabular-nums">{tx.resulting_balance} total</p>
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
                  <div className="space-y-4">
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
                      <div className="rounded-xl border border-line bg-card p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="size-4 text-primary" />
                          <p className="text-xs font-bold text-ink">Lessons</p>
                          <Badge variant="secondary" className="ml-auto text-[11px] font-bold px-2 py-0">
                            {data.content_footprint.lessons.total} total
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                            <span className="flex items-center gap-1">
                              <Eye className="size-3 text-emerald-500" />
                              {data.content_footprint.lessons.published} published
                            </span>
                            <span className="flex items-center gap-1">
                              <EyeOff className="size-3 text-ink-muted" />
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
                            <ExternalLink className="size-3" />
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
            <div className="shrink-0 border-t border-line bg-card/80 backdrop-blur-sm px-5 py-3 flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted mr-1">Actions</p>

              {/* Direct Warn Trigger */}
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                onClick={() => {
                  setInitialSanctionStatus("WARNING");
                  setSanctionOpen(true);
                }}
              >
                <AlertTriangle className="size-3 mr-1" /> Warn
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
                <ShieldAlert className="size-3 mr-1" /> Sanction
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
                    <Coins className="size-3 mr-1 text-amber-500" /> Points
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setRoleOpen(true)}
                  >
                    <Shield className="size-3 mr-1 text-primary" /> Role
                  </Button>
                </>
              )}

              <a
                href={`/users/${userId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Button size="sm" variant="ghost" className="text-xs text-ink-muted">
                  <ExternalLink className="size-3 mr-1" /> Profile
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

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
    <div className="rounded-xl border border-line bg-card p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 text-primary" />
        <p className="text-xs font-bold text-ink">{label}</p>
        <Badge variant="secondary" className="ml-auto text-[11px] font-bold px-2 py-0">
          {total} total
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1">
            <Eye className="size-3 text-emerald-500" />
            {active >= 0 ? active : 0} active
          </span>
          {hidden > 0 && (
            <span className="flex items-center gap-1">
              <EyeOff className="size-3 text-amber-500" />
              {hidden} hidden
            </span>
          )}
          {deleted > 0 && (
            <span className="flex items-center gap-1">
              <Trash2 className="size-3 text-destructive" />
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
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}

