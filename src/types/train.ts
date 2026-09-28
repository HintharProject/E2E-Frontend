export interface SiblingResource {
  id: string;
  file_name: string;
  file_url: string;
  download_url?: string;
  paper_code?: string | null;
  paper_type: "MS" | "QP";
  year?: string | number | null;
  session?: string | null;
}

export interface PairMsResponse {
  ms_available: boolean;
  sibling: SiblingResource | null;
  message?: string;
}

export interface TrainTreePaper {
  id: string;
  year?: string | number | null;
  session?: string | null;
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
  year: string | number;
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
