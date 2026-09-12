export * from "./contribution";
import type { ContributorTier, ReputationSummary } from "./contribution";

export type RoleEnum = "USER" | "MODERATOR" | "ADMIN" | "SUPERADMIN";
export type BanStatusEnum = "ACTIVE" | "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN";
export type PostTypeEnum = "QUESTION" | "SHARING" | "ANNOUNCEMENT";
export type StateEnum = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface UserPublic {
  id: string;
  clerk_id: string;
  display_name: string;
  profile_image_url: string | null;
  role: RoleEnum;
  created_at: string;
  weak_subjects?: string[] | null;
  good_subjects?: string[] | null;
  bio?: string | null;
  level?: string | null;
  custom_level?: string | null;
  contribution_points?: number;
  contributor_tier?: ContributorTier;
  dynamic_vote_weight?: number;
  reputation?: ReputationSummary;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
}

export interface Level {
  id: string;
  name: string;
  order?: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface LessonAttachment {
  id: string;
  lesson?: string; // Sometimes omitted or just string ID
  file_url: string;
  download_url?: string;
  file_name: string;
}

export interface Post {
  id: string;
  author: string;
  author_details: UserPublic;
  post_type: PostTypeEnum;
  title: string;
  body: string;
  subject: string | null;
  subject_details: Subject | null;
  level: string | null;
  level_details: Level | null;
  attachment_url: string | null;
  attachment_name?: string | null;
  tags_data: Tag[];
  created_at: string;
  updated_at: string;
  
  // Fields present in mock data or added for frontend convenience 
  // We'll map them if the backend provides them, else they remain optional for UI consistency.
  vote_count?: number;
  comment_count?: number;
  user_vote?: 1 | -1 | null;
}

export interface Comment {
  id: string;
  post: string; // Post ID
  author: string;
  author_details: UserPublic;
  body: string;
  created_at: string;
  updated_at: string;
  parent?: string | null;
  reply_count?: number;
  vote_count?: number;
  user_vote?: 1 | -1 | null;
  replies?: Comment[];
}

export interface Lesson {
  id: string;
  author: string;
  author_details: UserPublic;
  state: StateEnum;
  title: string;
  body: string;
  subject: string;
  subject_details: Subject;
  level: string;
  level_details: Level;
  embedded_video_url: string | null;
  attachments: LessonAttachment[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  vote_count?: number;
  user_vote?: 1 | -1 | null;
}

export interface PaginatedMeta {
  total_count: number;
  next: string | null;
  previous: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface StudyPlanItem {
  id: string;
  study_plan: string;
  lesson: string;
  added_at: string;
}

export interface StudyPlan {
  id: string;
  user: string;
  title: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items: StudyPlanItem[];
}

export interface SavedSessionItem {
  id: string;
  saved_session: string;
  post: string | null;
  lesson: string | null;
  added_at: string;
}

export interface SavedSession {
  id: string;
  user: string;
  title: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items: SavedSessionItem[];
}

export type ProblemStatusEnum = "OPEN" | "SOLVED" | "FINAL" | "CLOSED";
export type ProblemOriginEnum = "USER_UPLOAD" | "PAST_PAPER";
export type SolutionStatusEnum = "PENDING" | "WORKED" | "INCORRECT";

export interface Resource {
  id: string;
  title?: string;
  file_name?: string;
  resource_type?: string;
  year?: number;
  session?: string;
  paper_type?: string;
  file_url?: string;
  subject?: string;
  level?: string;
  subject_details?: Subject;
  level_details?: Level;
}

export interface ProblemAttachment {
  id: string;
  file_url: string;
  file_name: string;
  attachment_url: string | null;
  created_at: string;
}

export interface Problem {
  id: string;
  author: string;
  author_details: UserPublic;
  origin: ProblemOriginEnum;
  resource?: string | null;
  resource_id?: string | null;
  resource_details?: {
    id: string;
    title: string;
    year?: number;
    session?: string;
    paper_type?: string;
    file_url?: string;
  } | null;
  question_number?: string | null;
  title: string;
  body: string;
  subject: string;
  subject_details: Subject;
  level: string;
  level_details: Level;
  source?: string | null;
  ocr_text?: string | null;
  status: ProblemStatusEnum;
  is_feed_visible?: boolean;
  solved_at?: string | null;
  attachments: ProblemAttachment[];
  vote_count?: number;
  vote_score?: number;
  solution_count?: number;
  accepted_solution?: string | null;
  accepted_solution_id?: string | null;
  has_accepted_solution?: boolean;
  milestone_claimed?: boolean;
  user_vote?: 1 | -1 | null;
  created_at: string;
  updated_at: string;
}

export interface SolutionAttachment {
  id: string;
  file_url: string;
  file_name: string;
  attachment_url: string | null;
  created_at: string;
}

export interface VerificationMetrics {
  solved_score: number;
  peer_upvoters_count: number;
  is_maturation_met: boolean;
  decisive_margin: number;
}

export interface Solution {
  id: string;
  problem: string;
  author: string;
  author_details: UserPublic;
  body: string;
  video_url?: string | null;
  status: SolutionStatusEnum;
  is_accepted?: boolean;
  is_author_endorsed?: boolean;
  is_author_solution?: boolean;
  is_active_pool?: boolean;
  verification_metrics?: VerificationMetrics;
  attachments: SolutionAttachment[];
  vote_count?: number;
  vote_score?: number;
  user_vote?: 1 | -1 | null;
  created_at: string;
  updated_at: string;
  problem_title?: string;
  problem_details?: Problem;
}

export interface SolutionPoolResponse {
  active_count: number;
  max_pool_capacity: number;
  has_accepted_solution: boolean;
  solutions: Solution[];
}

export interface DeduplicationResponse {
  exists: boolean;
  problem: {
    id: string;
    origin: ProblemOriginEnum;
    status: ProblemStatusEnum;
    is_feed_visible: boolean;
    title: string;
    question_number: string;
    resource_id: string;
    vote_score: number;
    solution_count: number;
    has_accepted_solution: boolean;
    created_at: string;
  } | null;
  solutions: {
    id: string;
    author: {
      id: string;
      username: string;
      contributor_tier?: number;
      contributor_tier_name?: string;
    };
    body: string;
    video_url?: string | null;
    vote_score: number;
    is_author_solution?: boolean;
    is_author_endorsed?: boolean;
    is_accepted?: boolean;
    is_active_pool?: boolean;
    created_at: string;
  }[];
}

export interface PresignedUploadResponse {
  upload_url: string;
  file_key: string;
}

export interface EndorseSolutionResponse {
  solution_id: string;
  is_author_endorsed: boolean;
  solved_score: number;
  problem_status: string;
  dynamic_acceptance_triggered: boolean;
  message: string;
}

