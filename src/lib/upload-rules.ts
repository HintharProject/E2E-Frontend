export type UploadScope =
  | "problem_attachment"
  | "solution_attachment"
  | "past_paper"
  | "textbook"
  | "resource_document"
  | "lesson_attachment"
  | "post_attachment";

export interface ScopeValidationRule {
  allowedExtensions: readonly string[];
  allowedMimeTypes?: readonly string[];
  maxSizeMB: number;
  sizeMode: "per-file" | "total";
  maxFiles: number;
  userFriendlyName: string;
  acceptString: string;
  presignEndpoint: string;
}

export const UPLOAD_SCOPE_RULES: Record<UploadScope, ScopeValidationRule> = {
  problem_attachment: {
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
    sizeMode: "per-file",
    maxFiles: 3,
    userFriendlyName: "Problem Photo",
    acceptString: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    presignEndpoint: "/problems/generate_upload_url/",
  },
  solution_attachment: {
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
    sizeMode: "per-file",
    maxFiles: 3,
    userFriendlyName: "Solution Diagram",
    acceptString: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    presignEndpoint: "/problems/generate_upload_url/",
  },
  lesson_attachment: {
    allowedExtensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".zip",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ],
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    maxSizeMB: 20,
    sizeMode: "total",
    maxFiles: 5,
    userFriendlyName: "Lesson Material",
    acceptString:
      ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp",
    presignEndpoint: "/lessons/generate_upload_url/",
  },
  post_attachment: {
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    maxSizeMB: 5,
    sizeMode: "per-file",
    maxFiles: 1,
    userFriendlyName: "Forum Attachment",
    acceptString:
      ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf",
    presignEndpoint: "/posts/generate_upload_url/",
  },
  past_paper: {
    allowedExtensions: [".pdf"],
    allowedMimeTypes: ["application/pdf"],
    maxSizeMB: 50,
    sizeMode: "per-file",
    maxFiles: 50,
    userFriendlyName: "Past Paper PDF",
    acceptString: ".pdf,application/pdf",
    presignEndpoint: "/resources/generate_upload_url/",
  },
  textbook: {
    allowedExtensions: [".pdf", ".zip"],
    allowedMimeTypes: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
    ],
    maxSizeMB: 300,
    sizeMode: "per-file",
    maxFiles: 50,
    userFriendlyName: "Textbook / Archive",
    acceptString:
      ".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed",
    presignEndpoint: "/resources/generate_upload_url/",
  },
  resource_document: {
    allowedExtensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".zip",
    ],
    maxSizeMB: 300,
    sizeMode: "per-file",
    maxFiles: 50,
    userFriendlyName: "Resource Document",
    acceptString: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip",
    presignEndpoint: "/resources/generate_upload_url/",
  },
};

const EXTENSION_MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx <= 0 || idx === fileName.length - 1) return "";
  return fileName.slice(idx).toLowerCase();
}

/**
 * Infers a concrete MIME type when the browser leaves `file.type` empty (`""`)
 * so strict scopes (`post_attachment`, `problem_attachment`, `solution_attachment`,
 * `past_paper`) do not fail S3 presign / Content-Type checks.
 */
export function inferContentType(file: File): string {
  if (file.type && file.type.trim().length > 0) {
    return file.type;
  }
  const ext = getFileExtension(file.name);
  return EXTENSION_MIME_MAP[ext] ?? "application/octet-stream";
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface PreflightOptions {
  maxSizeOverrideMB?: number;
}

/**
 * Validates a single file on the client side before any network upload begins.
 */
export function validateFilePreflight(
  file: File,
  scope: UploadScope,
  options?: PreflightOptions
): FileValidationResult {
  const rule = UPLOAD_SCOPE_RULES[scope];
  if (!rule) {
    return { valid: true };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty (0 bytes). Please choose a non-empty file.`,
    };
  }

  const ext = getFileExtension(file.name);
  const hasValidExt = rule.allowedExtensions.some(
    (allowed) => allowed.toLowerCase() === ext
  );

  if (!hasValidExt) {
    return {
      valid: false,
      error: `Invalid file format for ${rule.userFriendlyName}: "${file.name}". Allowed: ${rule.allowedExtensions.join(", ")}`,
    };
  }

  const resolvedMime = inferContentType(file);
  if (rule.allowedMimeTypes) {
    const allowsOctetStream = rule.allowedMimeTypes.includes(
      "application/octet-stream"
    );
    const hasValidMime = rule.allowedMimeTypes.includes(resolvedMime);

    if (!hasValidMime && !(allowsOctetStream && resolvedMime === "application/octet-stream")) {
      return {
        valid: false,
        error: `Unsupported file type "${resolvedMime}" for ${rule.userFriendlyName}.`,
      };
    }
  }

  const limitMB = options?.maxSizeOverrideMB ?? rule.maxSizeMB;
  const maxBytes = limitMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File "${file.name}" is ${formatBytes(file.size)}. Maximum allowed size is ${limitMB} MB.`,
    };
  }

  return { valid: true };
}

export interface BatchValidationOptions extends PreflightOptions {
  existingBytes?: number;
}

/**
 * Validates a batch of incoming files against count, per-file rules, and total size limits.
 */
export function validateFileBatch(
  files: File[],
  scope: UploadScope,
  existingCount = 0,
  options?: BatchValidationOptions
): FileValidationResult {
  const rule = UPLOAD_SCOPE_RULES[scope];
  if (!rule) {
    return { valid: true };
  }

  if (existingCount + files.length > rule.maxFiles) {
    return {
      valid: false,
      error: `Maximum ${rule.maxFiles} ${rule.maxFiles === 1 ? "file" : "files"} allowed for ${rule.userFriendlyName}.`,
    };
  }

  for (const file of files) {
    const single = validateFilePreflight(file, scope, options);
    if (!single.valid) {
      return single;
    }
  }

  if (rule.sizeMode === "total") {
    const existingBytes = options?.existingBytes ?? 0;
    const incomingBytes = files.reduce((sum, f) => sum + f.size, 0);
    const totalBytes = existingBytes + incomingBytes;
    const maxBytes = rule.maxSizeMB * 1024 * 1024;

    if (totalBytes > maxBytes) {
      return {
        valid: false,
        error: `Total size (${formatBytes(totalBytes)}) exceeds the ${rule.maxSizeMB} MB limit for ${rule.userFriendlyName}.`,
      };
    }
  }

  return { valid: true };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) {
    return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

const ALLOWED_YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
]);

export function isAllowedYouTubeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return ALLOWED_YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}
