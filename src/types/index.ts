export type RoleEnum = "STUDENT" | "CREATOR" | "ADMIN";
export type BanStatusEnum = "NONE" | "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN";
export type PostTypeEnum = "QUESTION" | "SHARING" | "ANNOUNCEMENT";
export type StateEnum = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface UserPublic {
  id: string;
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
  lesson: string;
  file: string;
  filename: string;
  file_size: number;
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
