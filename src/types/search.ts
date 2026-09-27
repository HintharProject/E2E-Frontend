import { Subject, Level } from "./index";

export interface SearchAuthor {
  id: string;
  display_name: string;
  image_url: string | null;
}

export interface SearchPostItem {
  id: string;
  title: string;
  post_type: "QUESTION" | "SHARING" | "ANNOUNCEMENT";
  subject: Subject | null;
  level: Level | null;
  author: SearchAuthor | null;
  vote_score: number;
  comments_count: number;
  created_at: string;
}

export interface SearchProblemItem {
  id: string;
  title: string;
  subject: Subject | null;
  level: Level | null;
  author: SearchAuthor | null;
  solutions_count: number;
  is_verified: boolean;
  status: string;
  vote_score: number;
  created_at: string;
}

export interface SearchLessonItem {
  id: string;
  title: string;
  subject: Subject | null;
  level: Level | null;
  author: SearchAuthor | null;
  vote_score: number;
  created_at: string;
}

export interface SearchResourceItem {
  id: string;
  file_name: string;
  file_url: string;
  year: number | null;
  session: string | null;
  paper_type: string | null;
  paper_code: string | null;
  subject: Subject | null;
  level: Level | null;
  created_at: string;
}

export interface UnifiedSearchCounts {
  posts: number;
  problems: number;
  lessons: number;
  resources: number;
  total: number;
}

export interface UnifiedSearchResults {
  posts: SearchPostItem[];
  problems: SearchProblemItem[];
  lessons: SearchLessonItem[];
  resources: SearchResourceItem[];
}

export interface UnifiedSearchResponse {
  query: string;
  limit: number;
  counts: UnifiedSearchCounts;
  results: UnifiedSearchResults;
}

export type SearchCategoryFilter = "all" | "posts" | "problems" | "lessons" | "resources";
