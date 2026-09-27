export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "INAPPROPRIATE_CONTENT"
  | "CHEATING_ACADEMIC_DISHONESTY"
  | "COPYRIGHT_VIOLATION"
  | "OTHER";

export type SeverityLevel = "LOW" | "NORMAL" | "HIGH_PRIORITY" | "CRITICAL";

export type TargetType =
  | "PROBLEM"
  | "SOLUTION"
  | "POST"
  | "LESSON"
  | "COMMENT"
  | "USER";

export interface ReporterDetails {
  id: string;
  display_name: string;
  email?: string;
  contributor_tier?: number;
  role?: string;
}

export interface TargetAuthor {
  id: string;
  display_name: string;
  email?: string;
  role?: string;
  ban_status?: string;
  ban_expires_at?: string | null;
  lifetime_reports_received?: number;
  active_sanction?: string | null;
  profile_image_url?: string | null;
  contributor_tier?: number;
}

export interface TargetDetails {
  title?: string;
  question_number?: string;
  origin?: string;
  snippet?: string;
  content_latex?: string;
  content_markdown?: string;
  subject?: { id: string; name: string; code: string } | null;
  level?: { id: string; name: string; code: string } | null;
  parent_problem?: { id: string; title: string; url?: string } | null;
  parent_title?: string;
  parent_type?: string;
  url?: string;
  is_accepted?: boolean;
  status?: string;
  post_type?: string;
  tags?: string[];
  state?: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: Array<{ url: string; name: string }>;
  video_url?: string | null;
  embedded_video_url?: string | null;
  author?: TargetAuthor | null;
  // User profile specific
  display_name?: string;
  email?: string;
  bio?: string;
  profile_image_url?: string | null;
  contributor_tier?: number;
  role?: string;
  ban_status?: string;
  ban_expires_at?: string | null;
  lifetime_reports_received?: number;
  active_sanction?: string | null;
}

export interface ReportItem {
  id: string;
  reporter?: string;
  status: ReportStatus;
  reason: ReportReason | string;
  notes: string;
  severity: SeverityLevel | string;
  reported_user?: string | null;
  reported_post?: string | null;
  reported_lesson?: string | null;
  reported_problem?: string | null;
  reported_solution?: string | null;
  reported_comment?: string | null;
  created_at: string;
  resolved_at: string | null;
  target_type: TargetType;
  target_id: string;
  target_details?: TargetDetails | null;
  reporter_details?: ReporterDetails | null;
}

export interface ReportCounts {
  all: number;
  problems: number;
  solutions: number;
  posts: number;
  lessons: number;
  comments: number;
  profiles: number;
}
