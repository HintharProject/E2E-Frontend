export type RoleEnum = "STUDENT" | "CREATOR" | "ADMIN";
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

export type ProblemStatusEnum = "OPEN" | "SOLVED" | "CLOSED";
export type SolutionStatusEnum = "PENDING" | "WORKED" | "INCORRECT";

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
  title: string;
  body: string;
  subject: string;
  subject_details: Subject;
  level: string;
  level_details: Level;
  status: ProblemStatusEnum;
  attachments: ProblemAttachment[];
  vote_count?: number;
  solution_count?: number;
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

export interface Solution {
  id: string;
  problem: string;
  author: string;
  author_details: UserPublic;
  body: string;
  status: SolutionStatusEnum;
  attachments: SolutionAttachment[];
  vote_count?: number;
  user_vote?: 1 | -1 | null;
  created_at: string;
  updated_at: string;
}
