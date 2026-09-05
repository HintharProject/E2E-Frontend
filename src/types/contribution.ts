// src/types/contribution.ts

export type ContributorTier = 0 | 1 | 2 | 3 | 4;

export type ContributorTierName =
  | "Novice"
  | "Contributor"
  | "Pro Contributor"
  | "Master Contributor"
  | "Scholar";

export interface BadgeStyling {
  color_code: string;
  hex: string;
  flair_icon: string;
}

export interface TierProgress {
  current_tier_min: number;
  next_tier_threshold: number | null;
  points_to_next_tier: number | null;
  progress_percentage: number | null;
  demotion_buffer_threshold: number;
  points_above_demotion: number;
}

export interface ReputationSummary {
  contribution_points: number;
  contributor_tier: ContributorTier;
  contributor_tier_name: ContributorTierName;
  dynamic_vote_weight: number;
  badge_styling: BadgeStyling;
  tier_progress: TierProgress;
}

export interface CurationQuota {
  daily_cap: number;
  points_earned_today: number;
  points_remaining_today: number;
  resets_at: string;
}

export interface PointsBreakdown {
  solutions_upvotes: number;
  solutions_downvotes: number;
  solutions_pruned_penalties: number;
  problems_upvotes: number;
  problems_downvotes: number;
  problems_solved_milestones: number;
  posts_upvotes: number;
  posts_downvotes: number;
  lessons_upvotes: number;
  lessons_downvotes: number;
  comments_upvotes: number;
  comments_downvotes: number;
  peer_curation_votes: number;
  admin_adjustments: number;
}

export interface LifetimeTotals {
  total_points_earned: number;
  total_points_deducted: number;
  total_upvotes_received: number;
  total_downvotes_received: number;
  solutions_accepted_count: number;
  problems_solved_count: number;
}

export interface ContributionStats {
  user_id: string;
  current_net_points: number;
  contributor_tier: ContributorTier;
  curation_quota: CurationQuota;
  points_breakdown_by_category: PointsBreakdown;
  lifetime_totals: LifetimeTotals;
}

export type ContributionEventType =
  | "SOLUTION_UPVOTE"
  | "SOLUTION_DOWNVOTE"
  | "SOLUTION_AUTO_PRUNED"
  | "PROBLEM_UPVOTE"
  | "PROBLEM_DOWNVOTE"
  | "PROBLEM_SOLVED"
  | "POST_UPVOTE"
  | "POST_DOWNVOTE"
  | "LESSON_UPVOTE"
  | "LESSON_DOWNVOTE"
  | "COMMENT_UPVOTE"
  | "COMMENT_DOWNVOTE"
  | "CURATION_VOTE"
  | "CURATION_REVOKED"
  | "ADMIN_ADJUSTMENT"
  | string;

export interface ContributionTransaction {
  id: string;
  event_type: ContributionEventType;
  event_type_display: string;
  delta: number;
  resulting_balance: number;
  actor: {
    id: string;
    display_name: string;
    contributor_tier: ContributorTier;
  } | null;
  target_preview?: {
    content_type: string;
    object_id: string;
    title?: string;
    body_snippet?: string;
  } | null;
  metadata?: {
    diminishing_tier?: string;
    voter_weight?: number;
    ordinal_upvote_count?: number;
    reason?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface VoteMutationResponse {
  status: "APPLIED" | "NOOP" | "REVOKED" | "FLIPPED";
  target_type: string;
  target_id: string;
  user_vote: 1 | -1 | 0;
  voter_weight_applied?: number;
  content_score: number;
  author_points_awarded?: number;
  author_points_reverted?: number;
  curation_point_awarded?: boolean;
  curation_point_reverted?: boolean;
  curation_quota_remaining_today?: number;
  solution_pruned?: boolean;
}

export const TIER_CONFIG: Record<
  ContributorTier,
  {
    name: ContributorTierName;
    minPoints: number;
    voteMultiplier: number;
    flair: string;
    cssVar: string;
    bgVar: string;
  }
> = {
  0: {
    name: "Novice",
    minPoints: 0,
    voteMultiplier: 1,
    flair: "badge-novice",
    cssVar: "var(--color-tier-0)",
    bgVar: "var(--color-tier-0-bg)",
  },
  1: {
    name: "Contributor",
    minPoints: 50,
    voteMultiplier: 2,
    flair: "badge-contributor",
    cssVar: "var(--color-tier-1)",
    bgVar: "var(--color-tier-1-bg)",
  },
  2: {
    name: "Pro Contributor",
    minPoints: 250,
    voteMultiplier: 3,
    flair: "badge-pro",
    cssVar: "var(--color-tier-2)",
    bgVar: "var(--color-tier-2-bg)",
  },
  3: {
    name: "Master Contributor",
    minPoints: 750,
    voteMultiplier: 4,
    flair: "badge-master",
    cssVar: "var(--color-tier-3)",
    bgVar: "var(--color-tier-3-bg)",
  },
  4: {
    name: "Scholar",
    minPoints: 2000,
    voteMultiplier: 5,
    flair: "badge-scholar",
    cssVar: "var(--color-tier-4)",
    bgVar: "var(--color-tier-4-bg)",
  },
};
