import { apiFetch } from "@/services/api-client";

export type UploadScope =
  | "problem_attachment"
  | "solution_attachment"
  | "past_paper"
  | "textbook"
  | "resource_document"
  | "lesson_attachment"
  | "post_attachment";

export interface ScopeValidationRule {
  allowedExtensions: string[];
  allowedMimeTypes?: string[];
  maxSizeMB: number;
  userFriendlyName: string;
}

export const UPLOAD_SCOPE_RULES: Record<UploadScope, ScopeValidationRule> = {
  problem_attachment: {
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
    userFriendlyName: "Problem Photo",
  },
  solution_attachment: {
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
    userFriendlyName: "Solution Diagram",
  },
  past_paper: {
    allowedExtensions: [".pdf"],
    allowedMimeTypes: ["application/pdf"],
    maxSizeMB: 50,
    userFriendlyName: "Past Paper PDF",
  },
  textbook: {
    allowedExtensions: [".pdf", ".zip"],
    allowedMimeTypes: ["application/pdf", "application/zip", "application/x-zip-compressed"],
    maxSizeMB: 300,
    userFriendlyName: "Textbook / Archive",
  },
  resource_document: {
    allowedExtensions: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"],
    maxSizeMB: 300,
    userFriendlyName: "Resource Document",
  },
  lesson_attachment: {
    allowedExtensions: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".jpg", ".jpeg", ".png", ".webp"],
    maxSizeMB: 20,
    userFriendlyName: "Lesson Material",
  },
  post_attachment: {
    allowedExtensions: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".jpg", ".jpeg", ".png", ".webp"],
    maxSizeMB: 5,
    userFriendlyName: "Forum Attachment",
  },
};

/**
 * Validates a file on the client side before any network upload begins.
 * Returns an immediate, human-readable error if invalid.
 */
export function validateFilePreflight(
  file: File,
  scope: UploadScope
): { valid: boolean; error?: string } {
  const rule = UPLOAD_SCOPE_RULES[scope];
  if (!rule) {
    return { valid: true };
  }

  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
  const hasValidExt = rule.allowedExtensions.some(
    (allowed) => allowed.toLowerCase() === ext
  );

  if (!hasValidExt) {
    return {
      valid: false,
      error: `Invalid file format for ${rule.userFriendlyName}: "${file.name}". Allowed extensions: ${rule.allowedExtensions.join(", ")}`,
    };
  }

  if (rule.allowedMimeTypes && file.type) {
    const hasValidMime = rule.allowedMimeTypes.includes(file.type);
    if (!hasValidMime && file.type !== "application/octet-stream") {
      return {
        valid: false,
        error: `Invalid file type "${file.type}". Please upload a valid ${rule.userFriendlyName}.`,
      };
    }
  }

  const maxBytes = rule.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large: "${file.name}" is ${sizeInMB}MB. Maximum allowed size is ${rule.maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

export interface PresignedUploadResponse {
  upload_url: string;
  file_key: string;
  file_name: string;
  public_url?: string;
  expires_in?: number;
}

/**
 * Direct binary upload to Backblaze B2 via presigned URL with progress tracking.
 */
export async function uploadDirectlyToB2(
  file: File,
  scope: UploadScope,
  token: string | null,
  onProgress?: (percent: number) => void
): Promise<{ file_key: string; file_name: string; public_url?: string }> {
  // 1. Client-Side Preflight Validation
  const validation = validateFilePreflight(file, scope);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file");
  }

  // 2. Fetch Presigned S3 PUT URL
  let presignedEndpoint = "/problems/generate_upload_url/";
  if (scope === "past_paper" || scope === "textbook" || scope === "resource_document") {
    presignedEndpoint = "/resources/generate_upload_url/";
  }

  const presigned = await apiFetch<PresignedUploadResponse>(presignedEndpoint, token, {
    method: "POST",
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type || "application/octet-stream",
      upload_type: scope,
    }),
  });

  const uploadUrl = presigned.upload_url;
  if (!uploadUrl) {
    throw new Error("Failed to acquire presigned upload URL from storage service.");
  }

  // 3. Binary PUT to Backblaze B2
  if (onProgress) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      if (file.type) {
        xhr.setRequestHeader("Content-Type", file.type);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
        } else {
          reject(new Error(`Storage bucket returned HTTP ${xhr.status} while uploading ${file.name}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error(`Network error or CORS failure while uploading ${file.name} to storage bucket.`));
      };

      xhr.send(file);
    });
  } else {
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: file.type ? { "Content-Type": file.type } : undefined,
    });

    if (!putRes.ok) {
      throw new Error(`Failed to upload ${file.name} to storage bucket (HTTP ${putRes.status}).`);
    }
  }

  return {
    file_key: presigned.file_key,
    file_name: file.name,
    public_url: presigned.public_url,
  };
}
