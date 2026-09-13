export interface SiblingResource {
  id: string;
  file_name: string;
  file_url: string;
  download_url?: string;
  paper_code?: string | null;
  paper_type: "MS" | "QP";
  year?: number | null;
  session?: string | null;
}

export interface PairMsResponse {
  ms_available: boolean;
  sibling: SiblingResource | null;
  message?: string;
}

export interface TrainTreePaper {
  id: string;
  paper_code: string | null;
  paper_type?: "QP" | "MS" | string;
  label: string;
  file_name: string;
  file_url?: string;
  download_url?: string;
  has_ms: boolean;
  solutions_count: number;
}

export interface TrainTreeSession {
  session: string;
  session_label: string;
  papers: TrainTreePaper[];
}

export interface TrainTreeYear {
  year: number;
  sessions: TrainTreeSession[];
}

export interface TrainTreeResponse {
  subject: {
    id: string;
    name: string;
    code: string;
  };
  level: {
    id: string;
    name: string;
  };
  years: TrainTreeYear[];
}

export interface PersonalBestAttempt {
  attempt_id: string;
  percentage: string;
  projected_grade: string;
  completed_at: string | null;
}

export interface AttemptSummaryResponse {
  resource_id: string;
  total_attempts: number;
  personal_best: PersonalBestAttempt | null;
  average_percentage: string;
  latest_attempt: PersonalBestAttempt | null;
}

export interface AttemptedIdsResponse {
  attempted_resource_ids: string[];
}

export interface QuestionMarkInput {
  question_number: string;
  score_awarded: number;
  max_score: number;
  subtopic_tag?: string | null;
  student_notes?: string;
}

export interface CreateAttemptPayload {
  resource_id: string;
  mode?: "COUNTDOWN_EXAM" | "STOPWATCH_PRACTICE" | "UNTIMED_REVISION";
  target_duration_seconds?: number | null;
  time_spent_seconds: number;
  is_completed?: boolean;
  marks: QuestionMarkInput[];
}

export interface QuestionMark {
  id: string;
  question_number: string;
  score_awarded: string | number;
  max_score: string | number;
  subtopic_tag?: string | null;
  subtopic_tag_name?: string | null;
  student_notes?: string;
}

export interface WeakTopic {
  tag_id: string;
  tag_name: string;
  accuracy: number;
}

export interface PaperAttemptDetail {
  id: string;
  user: string;
  resource: string;
  resource_details: {
    id: string;
    file_name: string;
    subject_code?: string | null;
    year?: number | null;
    session?: string | null;
    paper_code?: string | null;
  };
  mode: "COUNTDOWN_EXAM" | "STOPWATCH_PRACTICE" | "UNTIMED_REVISION";
  target_duration_seconds?: number | null;
  time_spent_seconds: number;
  total_score: string | number;
  max_score: string | number;
  percentage: string | number;
  projected_grade: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  question_marks: QuestionMark[];
  weak_topics: WeakTopic[];
}

export interface PaperAttemptListItem {
  id: string;
  resource: string;
  resource_details: {
    id: string;
    file_name: string;
    subject_code?: string | null;
    year?: number | null;
    session?: string | null;
    paper_code?: string | null;
  };
  mode: "COUNTDOWN_EXAM" | "STOPWATCH_PRACTICE" | "UNTIMED_REVISION";
  target_duration_seconds?: number | null;
  time_spent_seconds: number;
  total_score: string | number;
  max_score: string | number;
  percentage: string | number;
  projected_grade: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface PaperAttemptListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PaperAttemptListItem[];
}

export interface GradeBoundary {
  id: string;
  subject: string;
  subject_code?: string;
  level: string;
  level_name?: string;
  year: number;
  session: string;
  paper_code: string;
  max_mark: number;
  thresholds: Record<string, number>;
}

export type TrainTimerMode = "COUNTDOWN_EXAM" | "STOPWATCH_PRACTICE" | "UNTIMED_REVISION";

export type TrainTimerPreset =
  | "MCQ_45"
  | "THEORY_AS_75"
  | "THEORY_A2_105"
  | "EXTENDED_120"
  | "CUSTOM";

export type TrainViewMode = "SINGLE" | "DUAL";

export interface TrainTimerState {
  mode: TrainTimerMode;
  targetDurationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  alertLevel: "NORMAL" | "WARNING" | "CRITICAL" | "EXPIRED";
}
