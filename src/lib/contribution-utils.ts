import type { ContributionStats } from "@/types/contribution";

export interface ActivityPointsSummary {
  lessons: number;
  posts: number;
  problems: number;
  solutions: number;
}

/**
 * Extracts or computes the net contribution points gained from each activity category.
 * Prioritizes pre-aggregated `activity_totals` from the backend, falling back gracefully
 * to summing the raw category breakdown fields.
 */
export function getActivityPoints(stats?: ContributionStats | null): ActivityPointsSummary {
  if (!stats) {
    return { lessons: 0, posts: 0, problems: 0, solutions: 0 };
  }

  if (stats.activity_totals) {
    return {
      lessons: stats.activity_totals.lessons ?? 0,
      posts: stats.activity_totals.posts ?? 0,
      problems: stats.activity_totals.problems ?? 0,
      solutions: stats.activity_totals.solutions ?? 0,
    };
  }

  const b = stats.points_breakdown_by_category;
  if (!b) {
    return { lessons: 0, posts: 0, problems: 0, solutions: 0 };
  }

  return {
    lessons: (b.lessons_upvotes ?? 0) + (b.lessons_downvotes ?? 0),
    posts: (b.posts_upvotes ?? 0) + (b.posts_downvotes ?? 0),
    problems: (b.problems_upvotes ?? 0) + (b.problems_downvotes ?? 0) + (b.problems_solved_milestones ?? 0),
    solutions: (b.solutions_upvotes ?? 0) + (b.solutions_downvotes ?? 0) + (b.solutions_pruned_penalties ?? 0),
  };
}

/**
 * Formats signed contribution points for display beside tabs and headers.
 * Examples: +45 pts, 0 pts, -10 pts.
 */
export function formatContributionPoints(points: number): string {
  if (points > 0) {
    return `+${points.toLocaleString()} pts`;
  }
  return `${points.toLocaleString()} pts`;
}
