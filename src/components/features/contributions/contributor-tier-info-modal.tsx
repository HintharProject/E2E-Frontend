"use client";

import * as React from "react";
import { ContributorTier, TIER_CONFIG } from "@/types/contribution";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  Award,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  Coins,
  Scale,
  CheckCircle2,
  FileText,
  MessageSquare,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export interface ContributorTierInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTier?: ContributorTier;
}

type TabKey = "tiers" | "points" | "rules";

const TIER_ICONS = {
  0: Shield,
  1: Award,
  2: Zap,
  3: Crown,
  4: Sparkles,
};

interface TierDetail {
  tier: ContributorTier;
  pointsRange: string;
  demotionBuffer: string;
  privileges: {
    title: string;
    description: string;
    isHighlight?: boolean;
  }[];
}

const TIER_DETAILS: Record<ContributorTier, TierDetail> = {
  0: {
    tier: 0,
    pointsRange: "0 – 49 pts",
    demotionBuffer: "N/A (Baseline)",
    privileges: [
      {
        title: "Standard Platform Access",
        description: "Post questions, answer problems, author lessons, and submit comments across all subjects.",
      },
      {
        title: "1x Dynamic Vote Weight",
        description: "Each upvote or downvote applies a baseline 1x impact to content rankings.",
      },
    ],
  },
  1: {
    tier: 1,
    pointsRange: "50 – 249 pts",
    demotionBuffer: "< 40 pts (10 pt buffer)",
    privileges: [
      {
        title: "2x Dynamic Vote Weight",
        description: "Your votes now carry double weight in community problem and solution scoring.",
        isHighlight: true,
      },
      {
        title: "Verified Contributor Badge",
        description: "Bronze Amber contributor badge recognized across forum threads, solutions, and profile.",
      },
    ],
  },
  2: {
    tier: 2,
    pointsRange: "250 – 749 pts",
    demotionBuffer: "< 240 pts (10 pt buffer)",
    privileges: [
      {
        title: "3x Dynamic Vote Weight",
        description: "Tripled impact on content scoring and peer reputation.",
      },
      {
        title: "Proactive 'Solve a Paper' Authoring",
        description: "Directly publish authoritative worked solutions to curated Past Papers without waiting for an open student request.",
        isHighlight: true,
      },
      {
        title: "Anti-Gridlock Pool Eviction",
        description: "When a problem's 7-slot solution pool is full, you can still submit by automatically evicting stale or low-scoring attempts (S ≤ 0).",
        isHighlight: true,
      },
    ],
  },
  3: {
    tier: 3,
    pointsRange: "750 – 1,999 pts",
    demotionBuffer: "< 740 pts (10 pt buffer)",
    privileges: [
      {
        title: "4x Dynamic Vote Weight",
        description: "Quadrupled governance influence across platform content and solution consensus.",
        isHighlight: true,
      },
      {
        title: "Master Domain Standing",
        description: "Emerald green badge reflecting trusted academic authority and high-confidence peer guidance.",
      },
      {
        title: "All Tier 2 Privileges Included",
        description: "Proactive Past Paper authoring and 7-slot anti-gridlock eviction privileges.",
      },
    ],
  },
  4: {
    tier: 4,
    pointsRange: "2,000+ pts",
    demotionBuffer: "< 1,990 pts (10 pt buffer)",
    privileges: [
      {
        title: "5x Maximum Vote Weight",
        description: "Maximum dynamic voting weight possible on the platform.",
        isHighlight: true,
      },
      {
        title: "Scholar Shimmer Flair",
        description: "Elite animated Diamond Violet shimmer badge honoring top academic community leaders.",
        isHighlight: true,
      },
      {
        title: "Consensus Finality Weight",
        description: "Decisive peer influence on rapid consensus acceptance gates and solution verification.",
      },
      {
        title: "Full Authoring & Eviction Privileges",
        description: "Unrestricted proactive past-paper solutions and anti-gridlock replacement capabilities.",
      },
    ],
  },
};

const POINTS_ACTIVITIES = [
  {
    category: "Solve! Solutions",
    icon: CheckCircle2,
    accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    items: [
      { action: "Solution Upvoted by Peer", delta: "+10 pts", type: "positive" },
      { action: "Solution Downvoted by Peer", delta: "-3 pts", type: "negative" },
      {
        action: "Solution Auto-Pruned by Consensus",
        detail: "Triggered if Score ≤ -5 with ≥ 3 unique downvoters",
        delta: "-15 pts",
        type: "negative",
      },
    ],
  },
  {
    category: "Solve! Problems",
    icon: HelpCircle,
    accent: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    items: [
      { action: "Problem Upvoted by Peer", delta: "+5 pts", type: "positive" },
      { action: "Problem Downvoted by Peer", delta: "-2 pts", type: "negative" },
      {
        action: "Problem Solved Milestone",
        detail: "Awarded to problem author when an answer is accepted",
        delta: "+10 pts",
        type: "positive",
      },
    ],
  },
  {
    category: "Learning Lessons",
    icon: BookOpen,
    accent: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    items: [
      { action: "Lesson Upvoted by Peer", delta: "+10 pts", type: "positive" },
      { action: "Lesson Downvoted by Peer", delta: "-3 pts", type: "negative" },
    ],
  },
  {
    category: "Forum Posts & Discussions",
    icon: FileText,
    accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    items: [
      { action: "Question or Sharing Post Upvoted", delta: "+5 pts", type: "positive" },
      { action: "Post Downvoted", delta: "-2 pts", type: "negative" },
    ],
  },
  {
    category: "Comments & Clarifications",
    icon: MessageSquare,
    accent: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    items: [
      { action: "Helpful Comment Upvoted", delta: "+2 pts", type: "positive" },
      { action: "Comment Downvoted", delta: "-1 pt", type: "negative" },
    ],
  },
];

export function ContributorTierInfoModal({
  open,
  onOpenChange,
  initialTier,
}: ContributorTierInfoModalProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("tiers");

  const tierRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  React.useEffect(() => {
    if (open && initialTier !== undefined && activeTab === "tiers") {
      const timer = setTimeout(() => {
        const el = tierRefs.current[initialTier];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, initialTier, activeTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border border-line bg-card shadow-2xl rounded-2xl"
        showCloseButton={true}
      >
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-line bg-surface/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold font-heading text-ink sm:text-lg">
                Contributor Tiers & Reputation
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-muted line-clamp-1">
                Merit-based influence, dynamic voting weights, and points progression
              </DialogDescription>
            </div>
          </div>

          {/* Segmented Tab Navigation */}
          <div className="mt-3 flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-line/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("tiers")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg font-medium transition-all",
                activeTab === "tiers"
                  ? "bg-card text-ink shadow-xs font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-card/50"
              )}
            >
              <Award className="size-3.5" />
              <span>Tier Privileges</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("points")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg font-medium transition-all",
                activeTab === "points"
                  ? "bg-card text-ink shadow-xs font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-card/50"
              )}
            >
              <Coins className="size-3.5" />
              <span>Points Breakdown</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rules")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg font-medium transition-all",
                activeTab === "rules"
                  ? "bg-card text-ink shadow-xs font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-card/50"
              )}
            >
              <Scale className="size-3.5" />
              <span>Fair Play Rules</span>
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: TIER PRIVILEGES */}
          {activeTab === "tiers" && (
            <div className="space-y-4">
              {/* Formula Callout Banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-ink space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <TrendingUp className="size-3.5" />
                  <span>Dynamic Vote Multiplier Formula</span>
                </div>
                <p className="text-ink-muted leading-relaxed">
                  Your platform voting weight dynamically equals{" "}
                  <code className="px-1 py-0.5 rounded bg-primary/10 font-mono font-semibold text-primary">
                    Tier + 1
                  </code>{" "}
                  (ranging from <span className="font-semibold text-ink">1x</span> up to{" "}
                  <span className="font-semibold text-ink">5x</span>). When you upvote or downvote,
                  the content&apos;s ranking score changes by your exact multiplier!
                </p>
              </div>

              {/* Tier Cards List */}
              <div className="space-y-3">
                {([0, 1, 2, 3, 4] as ContributorTier[]).map((t) => {
                  const config = TIER_CONFIG[t];
                  const details = TIER_DETAILS[t];
                  const Icon = TIER_ICONS[t];
                  const isCurrent = initialTier === t;

                  const tierStyles = {
                    0: "border-tier-0/40 bg-tier-0-bg/50",
                    1: "border-tier-1/40 bg-tier-1-bg/50",
                    2: "border-tier-2/40 bg-tier-2-bg/50",
                    3: "border-tier-3/40 bg-tier-3-bg/50",
                    4: "border-purple-400/40 bg-purple-500/5",
                  }[t];

                  const badgePillStyles = {
                    0: "border-tier-0/30 bg-tier-0-bg text-tier-0",
                    1: "border-tier-1/30 bg-tier-1-bg text-tier-1 font-medium",
                    2: "border-tier-2/30 bg-tier-2-bg text-tier-2 font-medium",
                    3: "border-tier-3/30 bg-tier-3-bg text-tier-3 font-semibold",
                    4: "border-purple-400/40 animate-scholar-shimmer text-white font-bold shadow-xs",
                  }[t];

                  return (
                    <div
                      key={t}
                      ref={(el) => {
                        tierRefs.current[t] = el;
                      }}
                      className={cn(
                        "rounded-xl border p-4 transition-all duration-200",
                        tierStyles,
                        isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-card shadow-sm"
                      )}
                    >
                      {/* Tier Card Top Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line/60">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border select-none",
                              badgePillStyles
                            )}
                          >
                            <Icon className="size-3.5 shrink-0" />
                            <span>{config.name}</span>
                            <span className="opacity-80 text-[10px] font-normal">
                              (Tier {t})
                            </span>
                          </span>

                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                              Selected
                            </span>
                          )}
                        </div>

                        {/* Multiplier and Threshold */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-ink bg-card px-2 py-0.5 rounded-md border border-line shadow-2xs">
                            {config.voteMultiplier}x Vote Weight
                          </span>
                          <span className="font-mono text-ink-muted">
                            {details.pointsRange}
                          </span>
                        </div>
                      </div>

                      {/* Privileges List */}
                      <div className="mt-3 space-y-2">
                        {details.privileges.map((priv, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <CheckCircle2
                              className={cn(
                                "size-3.5 mt-0.5 shrink-0",
                                priv.isHighlight
                                  ? "text-primary"
                                  : "text-ink-muted"
                              )}
                            />
                            <div>
                              <span
                                className={cn(
                                  "font-medium",
                                  priv.isHighlight ? "text-ink font-semibold" : "text-ink"
                                )}
                              >
                                {priv.title}:
                              </span>{" "}
                              <span className="text-ink-muted leading-relaxed">
                                {priv.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Demotion Buffer Footnote */}
                      <div className="mt-3 pt-2 text-[11px] text-ink-muted flex items-center justify-between border-t border-line/40">
                        <span>Demotion threshold:</span>
                        <span className="font-mono">{details.demotionBuffer}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: POINTS BREAKDOWN */}
          {activeTab === "points" && (
            <div className="space-y-4">
              {/* Meritocracy Info Callout */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-ink space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Coins className="size-3.5" />
                  <span>Pure Author Meritocracy</span>
                </div>
                <p className="text-ink-muted leading-relaxed">
                  Voters receive <span className="font-semibold text-ink">0 points</span> for voting.
                  Contribution points are earned strictly by publishing quality answers, insightful
                  questions, and structured lessons that assist other students.
                </p>
              </div>

              {/* Activity Cards */}
              <div className="grid gap-3 sm:grid-cols-1">
                {POINTS_ACTIVITIES.map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-line bg-card p-4 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded-lg border",
                            act.accent
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <h4 className="text-xs font-bold font-heading text-ink">
                          {act.category}
                        </h4>
                      </div>

                      <div className="divide-y divide-line/60">
                        {act.items.map((item, iIdx) => (
                          <div
                            key={iIdx}
                            className="flex items-center justify-between gap-3 py-2 text-xs first:pt-1 last:pb-0"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-ink truncate">
                                {item.action}
                              </div>
                              {"detail" in item && item.detail && (
                                <div className="text-[11px] text-ink-muted">
                                  {item.detail}
                                </div>
                              )}
                            </div>

                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-mono text-xs font-bold shrink-0",
                                item.type === "positive"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              )}
                            >
                              {item.type === "positive" ? (
                                <ArrowUpRight className="size-3" />
                              ) : (
                                <ArrowDownRight className="size-3" />
                              )}
                              {item.delta}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FAIR PLAY RULES */}
          {activeTab === "rules" && (
            <div className="space-y-3">
              {/* Diminishing Returns */}
              <div className="rounded-xl border border-line bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                  <Flame className="size-4 text-amber-500" />
                  <span>Diminishing Marginal Returns per Content Item</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  To prevent a single viral post or solution from disproportionately inflating a user&apos;s
                  standing, author point yields scale gradually:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1.5 text-center text-xs">
                  <div className="p-2 rounded-lg bg-muted/50 border border-line/60">
                    <div className="font-bold text-ink">1 to 10</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      100% yield
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border border-line/60">
                    <div className="font-bold text-ink">11 to 30</div>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      50% yield
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border border-line/60">
                    <div className="font-bold text-ink">31+</div>
                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                      20% yield (min 1 pt)
                    </div>
                  </div>
                </div>
              </div>

              {/* Hysteresis Protection */}
              <div className="rounded-xl border border-line bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                  <RefreshCw className="size-4 text-primary" />
                  <span>10-Point Demotion Hysteresis Buffer</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Demotions require dropping at least{" "}
                  <span className="font-semibold text-ink">10 points below</span> the entry
                  threshold. For example, if you reach Tier 2 (250 pts), you do not demote to Tier 1
                  unless your points drop below <span className="font-mono font-semibold">240 pts</span>.
                  This eliminates frustrating badge flickering at boundary scores.
                </p>
              </div>

              {/* Anti-Collusion & Sybil Mitigation */}
              <div className="rounded-xl border border-line bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                  <ShieldCheck className="size-4 text-indigo-500" />
                  <span>Anti-Collusion & Sybil Mitigation</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  If User A casts more than <span className="font-semibold text-ink">15 upvotes</span> on
                  User B&apos;s content within a rolling 24-hour window, subsequent upvotes will continue to
                  adjust the public content score, but will award{" "}
                  <span className="font-semibold text-ink">0 author points</span> to prevent vote-ring
                  farming.
                </p>
              </div>

              {/* Self-Vote & Floor Invariants */}
              <div className="rounded-xl border border-line bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                  <AlertCircle className="size-4 text-cyan-500" />
                  <span>Self-Voting & Balance Floors</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Users cannot vote on their own content for point gains. Furthermore, your net
                  contribution balance is protected with a hard floor and cannot drop below{" "}
                  <span className="font-mono font-semibold text-ink">0 points</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-line bg-surface/50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-ink-muted hidden sm:inline">
            Tiers recalculate dynamically in real-time.
          </div>
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Close
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
