export interface PlatformSummary {
  total_lessons: number;
  total_posts: number;
  total_problems: number;
  total_solutions: number;
  total_comments: number;
  total_assets: number;
  pending_reports_count: number;
  unanswered_problems_count: number;
  solved_problems_count: number;
  avg_solutions_per_problem: number;
  avg_comments_per_post: number;
  problem_solved_rate_pct: number;
}

export interface SubjectAnalytics {
  id: string;
  name: string;
  code: string;
  lessons_count: number;
  posts_count: number;
  problems_count: number;
  solutions_count: number;
  comments_count: number;
  unanswered_problems_count: number;
  solved_problems_count: number;
  avg_solutions_per_problem: number;
  avg_comments_per_post: number;
  solved_rate_pct: number;
  total_activity: number;
}

export interface LevelAnalytics {
  id: string;
  name: string;
  code: string;
  lessons_count: number;
  posts_count: number;
  problems_count: number;
  solutions_count: number;
  comments_count: number;
  unanswered_problems_count: number;
  solved_problems_count: number;
  avg_solutions_per_problem: number;
  avg_comments_per_post: number;
  solved_rate_pct: number;
  total_activity: number;
}

export interface MatrixItem {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  level_id: string;
  level_name: string;
  level_code: string;
  lessons_count: number;
  posts_count: number;
  problems_count: number;
  solutions_count: number;
  unanswered_problems_count: number;
  avg_solutions_per_problem: number;
  total_activity: number;
}

export interface AnalyticsResponse {
  summary: PlatformSummary;
  by_subject: SubjectAnalytics[];
  by_level: LevelAnalytics[];
  matrix: MatrixItem[];
  active_subjects: { id: string; name: string; post_count: number }[];
  problems_by_level: { id: string; name: string; problem_count: number }[];
  pending_reports_count: number;
}

export type BaseDimension = "subject" | "level" | "content";
export type GroupingDimension = "content" | "level" | "subject";
export type ContentTypeKey = "lessons" | "posts" | "problems" | "solutions";

export interface ExplorerFilters {
  selectedSubjectIds: string[];
  selectedLevelIds: string[];
  selectedContentTypes: ContentTypeKey[];
}

