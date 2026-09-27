import type { Post, Lesson, Problem, Solution, Resource } from "./index";

export type SavedItemType = "POST" | "PROBLEM" | "SOLUTION" | "LESSON" | "RESOURCE" | "UNKNOWN";

export interface SavedSessionItem {
  id: string;
  saved_session: string;
  item_type: SavedItemType;
  post: string | null;
  post_details?: Post | null;
  problem: string | null;
  problem_details?: Problem | null;
  solution: string | null;
  solution_details?: Solution | null;
  lesson: string | null;
  lesson_details?: Lesson | null;
  resource: string | null;
  resource_details?: Resource | null;
  added_at: string;
}

export interface SavedSession {
  id: string;
  user: string;
  title: string;
  name?: string; // for backwards compatibility
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items: SavedSessionItem[];
}

export interface StudyPlanItem {
  id: string;
  study_plan: string;
  item_type?: SavedItemType;
  lesson?: string | null;
  lesson_details?: Lesson | null;
  problem?: string | null;
  problem_details?: Problem | null;
  solution?: string | null;
  solution_details?: Solution | null;
  resource?: string | null;
  resource_details?: Resource | null;
  added_at: string;
}

export interface StudyPlan {
  id: string;
  user: string;
  title: string;
  name?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items: StudyPlanItem[];
}

export type SaveTargetType = "post" | "problem" | "solution" | "lesson" | "resource";

export interface SaveTargetPayload {
  post?: string;
  problem?: string;
  solution?: string;
  lesson?: string;
  resource?: string;
}
