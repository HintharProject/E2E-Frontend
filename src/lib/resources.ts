export const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019] as const;

export const SESSIONS = [
  { value: "MAY_JUNE", label: "May / June" },
  { value: "OCT_NOV", label: "Oct / Nov" },
  { value: "JANUARY", label: "January" },
] as const;

export const PAPER_TYPES = [
  { value: "QP", label: "Question Paper (QP)" },
  { value: "MS", label: "Mark Scheme (MS)" },
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".rtf",
  ".epub",
  ".zip",
] as const;

export const ACCEPT_STRING = ALLOWED_DOCUMENT_EXTENSIONS.join(",");
export const MAX_PAST_PAPER_FILE_SIZE_MB = 50;
export const MAX_TEXTBOOK_FILE_SIZE_MB = 300;

export type ResourceType = "PAST_PAPER" | "TEXTBOOK";
export type SessionType = "MAY_JUNE" | "OCT_NOV" | "JANUARY";
export type PaperType = "QP" | "MS";

export interface BulkQueueItem {
  id: string;
  file: File;
  fileName: string;
  resourceType: ResourceType;
  year: number;
  session: string;
  paperType: string;
  status: "IDLE" | "UPLOADING" | "SUCCESS" | "ERROR";
  errorMessage?: string;
}

/**
 * Extracts lowercase file extension including dot (e.g. '.pdf', '.zip')
 */
export function getFileExtension(filename: string): string {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : "";
}

/**
 * Validates file extension and size (<= 50MB for Past Papers, <= 300MB for Textbooks)
 */
export function isValidDocumentFile(
  file: File,
  resourceType?: ResourceType
): { valid: boolean; error?: string } {
  const ext = getFileExtension(file.name);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as any)) {
    return {
      valid: false,
      error: `File "${file.name}" has unsupported format '${ext}'. Allowed: ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}`,
    };
  }

  // ZIP files are only allowed for Textbooks and Document packages
  if (ext === ".zip" && resourceType === "PAST_PAPER") {
    return {
      valid: false,
      error: `ZIP files are only supported for Textbooks and general resources, not for single Past Papers.`,
    };
  }

  const maxMb = resourceType === "TEXTBOOK" ? MAX_TEXTBOOK_FILE_SIZE_MB : (resourceType === "PAST_PAPER" ? MAX_PAST_PAPER_FILE_SIZE_MB : MAX_TEXTBOOK_FILE_SIZE_MB);
  if (file.size > maxMb * 1024 * 1024) {
    return {
      valid: false,
      error: `File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed for ${resourceType === "PAST_PAPER" ? "Past Papers" : "Textbooks"}: ${maxMb}MB.`,
    };
  }
  return { valid: true };
}

/**
 * Smart filename parser for auto-detecting exam metadata from common filename conventions
 * e.g., "0580_s23_qp_21.pdf" -> Year: 2023, Session: MAY_JUNE, Paper: QP
 */
export function parseResourceFileName(rawName: string): {
  year?: number;
  session?: SessionType;
  paperType?: PaperType;
  resourceType?: ResourceType;
} {
  const lower = rawName.toLowerCase();
  const ext = getFileExtension(rawName);

  // If extension is .zip, it's always a Textbook / Resource bundle
  if (ext === ".zip") {
    return {
      resourceType: "TEXTBOOK",
    };
  }

  // Detect Year (2019-2026 or shorthand like s23, w24, m22, _23_)
  let year: number | undefined;
  for (const y of YEARS) {
    const shortY = String(y).slice(-2);
    if (
      lower.includes(String(y)) ||
      lower.includes(`_${shortY}_`) ||
      lower.includes(`-${shortY}-`) ||
      lower.includes(`s${shortY}`) ||
      lower.includes(`w${shortY}`) ||
      lower.includes(`m${shortY}`) ||
      lower.includes(`j${shortY}`) ||
      lower.includes(`n${shortY}`)
    ) {
      year = y;
      break;
    }
  }

  // Detect Session
  let session: SessionType | undefined;
  if (/(_s\d\d|summer|may|june|mj|_s_|\bs\b)/i.test(lower)) {
    session = "MAY_JUNE";
  } else if (/(_w\d\d|winter|oct|nov|november|on|_w_|\bw\b)/i.test(lower)) {
    session = "OCT_NOV";
  } else if (/(_m\d\d|jan|january|spring|_m_|\bm\b)/i.test(lower)) {
    session = "JANUARY";
  }

  // Detect Paper Type
  let paperType: PaperType | undefined;
  if (/(ms|mark\s*scheme|marking|_ms_|-ms-)/i.test(lower)) {
    paperType = "MS";
  } else if (/(qp|question\s*paper|question|_qp_|-qp-)/i.test(lower)) {
    paperType = "QP";
  }

  // Detect Resource Type: keyword match or past-paper structural pattern
  let resourceType: ResourceType | undefined;
  if (/(book|textbook|guide|syllabus|ebook|handbook|note|chapter|unit|slides|lecture|bundle|archive)/i.test(lower)) {
    resourceType = "TEXTBOOK";
  } else if (paperType || session || /past\s*paper|exam|specimen/i.test(lower)) {
    resourceType = "PAST_PAPER";
  }

  return {
    year,
    session,
    paperType,
    resourceType,
  };
}
