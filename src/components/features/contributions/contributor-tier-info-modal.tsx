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
        title: "Confidence Band Authority",
        description: "3x dynamic vote weight significantly strengthens peer solution rankings and problem resolution confidence.",
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
        description: "Includes proactive Past Paper authoring and boosted governance weight on solution confidence.",
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
        title: "High-Weight Confidence Impact",
        description: "Decisive peer voting power that rapidly elevates verified worked solutions and problem confidence.",
      },
      {
        title: "Proactive Past Paper Authoring",
        description: "Unrestricted proactive worked solutions across curated exam papers in Train!.",
      },
    ],
  },
};

const POINTS_ACTIVITIES = [
  {
    category: "Solve! Solutions",
    icon: CheckCircle2,
    accent: "text-primary bg-primary/10 border-primary/20",
    items: [
      { action: "Solution Upvoted by Peer", delta: "+10 pts", type: "positive" },
      {
        action: "Solution Upvoted by Problem Author (3x Weight)",
        detail: "Problem Author upvote carries 3x score weight (+3 to +15) and yields standard diminishing solver points",
        delta: "+10 pts base",
        type: "positive",
      },
      { action: "Solution Downvoted by Peer", delta: "-3 pts", type: "negative" },
    ],
  },
  {
    category: "Solve! Problems",
    icon: HelpCircle,
    accent: "text-chart-3 bg-chart-3/10 border-chart-3/20",
    items: [
      { action: "Problem Upvoted by Peer", delta: "+5 pts", type: "positive" },
      { action: "Problem Downvoted by Peer", delta: "-2 pts", type: "negative" },
    ],
  },
  {
    category: "Learning Lessons",
    icon: BookOpen,
    accent: "text-tier-4 bg-tier-4-bg border-tier-4/25",
    items: [
      { action: "Lesson Upvoted by Peer", delta: "+10 pts", type: "positive" },
      { action: "Lesson Downvoted by Peer", delta: "-3 pts", type: "negative" },
    ],
  },
  {
    category: "Forum Posts & Discussions",
    icon: FileText,
    accent: "text-warning bg-warning/10 border-warning/20",
    items: [
      { action: "Question or Sharing Post Upvoted", delta: "+5 pts", type: "positive" },
      { action: "Post Downvoted", delta: "-2 pts", type: "negative" },
    ],
  },
  {
    category: "Comments & Clarifications",
    icon: MessageSquare,
    accent: "text-chart-4 bg-chart-4/10 border-chart-4/20",
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
        className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border border-border bg-card shadow-modal rounded-2xl"
        showCloseButton={true}
      >
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold font-heading text-foreground sm:text-lg">
                Contributor Tiers & Reputation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                Merit-based influence, dynamic voting weights, and points progression
              </DialogDescription>
            </div>
          </div>

          {/* Segmented Tab Navigation */}
          <div
            role="tablist"
            aria-label="Contributor tier guide sections"
            className="mt-3 flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "tiers"}
              onClick={() => setActiveTab("tiers")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[36px] sm:min-h-0 rounded-lg font-medium transition-colors cursor-pointer",
                activeTab === "tiers"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Award className="size-3.5" aria-hidden="true" />
              <span>Tier Privileges</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "points"}
              onClick={() => setActiveTab("points")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[36px] sm:min-h-0 rounded-lg font-medium transition-colors cursor-pointer",
                activeTab === "points"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Coins className="size-3.5" aria-hidden="true" />
              <span>Points Breakdown</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "rules"}
              onClick={() => setActiveTab("rules")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 min-h-[36px] sm:min-h-0 rounded-lg font-medium transition-colors cursor-pointer",
                activeTab === "rules"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Scale className="size-3.5" aria-hidden="true" />
              <span>Fair Play Rules</span>
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: TIER PRIVILEGES */}
          {activeTab === "tiers" && (
            <div className="space-y-4" role="tabpanel">
              {/* Formula Callout Banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  <span>Dynamic Vote Multiplier Formula</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Your platform voting weight dynamically equals{" "}
                  <code className="px-1 py-0.5 rounded bg-primary/10 font-mono font-semibold text-primary">
                    Tier + 1
                  </code>{" "}
                  (ranging from <span className="font-semibold text-foreground">1x</span> up to{" "}
                  <span className="font-semibold text-foreground">5x</span>). When you upvote or downvote,
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
                    4: "border-tier-4/40 bg-tier-4-bg/50",
                  }[t];

                  const badgePillStyles = {
                    0: "border-tier-0/30 bg-tier-0-bg text-tier-0",
                    1: "border-tier-1/30 bg-tier-1-bg text-tier-1 font-medium",
                    2: "border-tier-2/30 bg-tier-2-bg text-tier-2 font-medium",
                    3: "border-tier-3/30 bg-tier-3-bg text-tier-3 font-semibold",
                    4: "border-tier-4/40 animate-scholar-shimmer text-tier-4-foreground font-bold shadow-xs",
                  }[t];

                  return (
                    <div
                      key={t}
                      ref={(el) => {
                        tierRefs.current[t] = el;
                      }}
                      className={cn(
                        "rounded-xl border p-4 transition-colors duration-200",
                        tierStyles,
                        isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-card shadow-sm"
                      )}
                    >
                      {/* Tier Card Top Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border select-none",
                              badgePillStyles
                            )}
                          >
                            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
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
                          <span className="font-mono tabular-nums font-semibold text-foreground bg-card px-2 py-0.5 rounded-md border border-border shadow-2xs">
                            {config.voteMultiplier}x Vote Weight
                          </span>
                          <span className="font-mono tabular-nums text-muted-foreground">
                            {details.pointsRange}
                          </span>
                        </div>
                      </div>

                      {/* Privileges List */}
                      <div className="mt-3 space-y-2">
                        {details.privileges.map((priv, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <CheckCircle2
                              aria-hidden="true"
                              className={cn(
                                "size-3.5 mt-0.5 shrink-0",
                                priv.isHighlight
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                            <div>
                              <span
                                className={cn(
                                  "font-medium",
                                  priv.isHighlight ? "text-foreground font-semibold" : "text-foreground"
                                )}
                              >
                                {priv.title}:
                              </span>{" "}
                              <span className="text-muted-foreground leading-relaxed">
                                {priv.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Demotion Buffer Footnote */}
                      <div className="mt-3 pt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40">
                        <span>Demotion threshold:</span>
                        <span className="font-mono tabular-nums">{details.demotionBuffer}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: POINTS BREAKDOWN */}
          {activeTab === "points" && (
            <div className="space-y-4" role="tabpanel">
              {/* Meritocracy Info Callout */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Coins className="size-3.5" aria-hidden="true" />
                  <span>Pure Author Meritocracy</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Voters receive <span className="font-semibold text-foreground">0 points</span> for voting.
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
                      className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded-lg border",
                            act.accent
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                        </div>
                        <h4 className="text-xs font-bold font-heading text-foreground">
                          {act.category}
                        </h4>
                      </div>

                      <div className="divide-y divide-border/60">
                        {act.items.map((item, iIdx) => (
                          <div
                            key={iIdx}
                            className="flex items-center justify-between gap-3 py-2 text-xs first:pt-1 last:pb-0"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {item.action}
                              </div>
                              {"detail" in item && item.detail && (
                                <div className="text-[11px] text-muted-foreground">
                                  {item.detail}
                                </div>
                              )}
                            </div>

                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-mono tabular-nums text-xs font-bold shrink-0",
                                item.type === "positive"
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-destructive/10 text-destructive border border-destructive/20"
                              )}
                            >
                              {item.type === "positive" ? (
                                <ArrowUpRight className="size-3" aria-hidden="true" />
                              ) : (
                                <ArrowDownRight className="size-3" aria-hidden="true" />
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
            <div className="space-y-3" role="tabpanel">
              {/* Diminishing Returns */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Flame className="size-4 text-warning" aria-hidden="true" />
                  <span>Diminishing Marginal Returns per Content Item</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To prevent a single viral post or solution from disproportionately inflating a user&apos;s
                  standing, author point yields scale gradually:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1.5 text-center text-xs">
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/60">
                    <div className="font-mono tabular-nums font-bold text-foreground">1 to 10</div>
                    <div className="text-[11px] text-primary font-semibold">
                      100% yield
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/60">
                    <div className="font-mono tabular-nums font-bold text-foreground">11 to 30</div>
                    <div className="text-[11px] text-chart-3 font-semibold">
                      50% yield
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/60">
                    <div className="font-mono tabular-nums font-bold text-foreground">31+</div>
                    <div className="text-[11px] text-tier-4 font-semibold">
                      20% yield (min 1 pt)
                    </div>
                  </div>
                </div>
              </div>

              {/* Hysteresis Protection */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <RefreshCw className="size-4 text-primary" aria-hidden="true" />
                  <span>10-Point Demotion Hysteresis Buffer</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Demotions require dropping at least{" "}
                  <span className="font-semibold text-foreground">10 points below</span> the entry
                  threshold. For example, if you reach Tier 2 (250 pts), you do not demote to Tier 1
                  unless your points drop below <span className="font-mono font-semibold">240 pts</span>.
                  This eliminates frustrating badge flickering at boundary scores.
                </p>
              </div>

              {/* Anti-Collusion & Sybil Mitigation */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <ShieldCheck className="size-4 text-chart-3" aria-hidden="true" />
                  <span>Anti-Collusion & Sybil Mitigation</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If User A casts more than <span className="font-semibold text-foreground">15 upvotes</span> on
                  User B&apos;s content within a rolling 24-hour window, subsequent upvotes will continue to
                  adjust the public content score, but will award{" "}
                  <span className="font-semibold text-foreground">0 author points</span> to prevent vote-ring
                  farming.
                </p>
              </div>

              {/* Self-Vote & Floor Invariants */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <AlertCircle className="size-4 text-chart-4" aria-hidden="true" />
                  <span>Self-Voting & Balance Floors</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Users cannot vote on their own content for point gains. Furthermore, your net
                  contribution balance is protected with a hard floor and cannot drop below{" "}
                  <span className="font-mono font-semibold text-foreground">0 points</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground hidden sm:inline">
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
