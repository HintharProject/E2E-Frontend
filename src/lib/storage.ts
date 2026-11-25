import { apiFetch } from "@/services/api-client";
import {
  UPLOAD_SCOPE_RULES,
  UploadScope,
  ScopeValidationRule,
  validateFilePreflight,
  validateFileBatch,
  formatBytes,
  isAllowedYouTubeUrl,
  inferContentType,
} from "./upload-rules";

export {
  UPLOAD_SCOPE_RULES,
  validateFilePreflight,
  validateFileBatch,
  formatBytes,
  isAllowedYouTubeUrl,
  inferContentType,
};
export type { UploadScope, ScopeValidationRule };

export interface PresignedUploadResponse {
  upload_url: string;
  file_key: string;
  file_name: string;
  public_url?: string;
  file_url?: string;
  expires_in?: number;
}

export interface UploadDirectlyToB2Options {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Direct binary upload to Backblaze B2 via presigned URL with progress tracking and cancellation.
 * Preserves backwards-compatible `(percent: number) => void` fourth argument for Admin callers.
 */
export async function uploadDirectlyToB2(
  file: File,
  scope: UploadScope,
  token: string | null,
  optionsOrOnProgress?: UploadDirectlyToB2Options | ((percent: number) => void)
): Promise<{ file_key: string; file_name: string; public_url?: string }> {
  const options: UploadDirectlyToB2Options =
    typeof optionsOrOnProgress === "function"
      ? { onProgress: optionsOrOnProgress }
      : (optionsOrOnProgress ?? {});
  const { onProgress, signal } = options;

  if (signal?.aborted) {
    throw new DOMException("Upload cancelled", "AbortError");
  }

  // 1. Client-Side Preflight Validation
  const validation = validateFilePreflight(file, scope);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file");
  }

  // 2. Infer concrete MIME type when browser leaves file.type empty
  const contentType = inferContentType(file);
  const presignedEndpoint =
    UPLOAD_SCOPE_RULES[scope]?.presignEndpoint ?? "/problems/generate_upload_url/";

  const presigned = await apiFetch<PresignedUploadResponse>(
    presignedEndpoint,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        file_name: file.name,
        content_type: contentType,
        file_size: file.size,
        upload_type: scope,
      }),
    }
  );

  if (signal?.aborted) {
    throw new DOMException("Upload cancelled", "AbortError");
  }

  const uploadUrl = presigned.upload_url;
  if (!uploadUrl) {
    throw new Error("Failed to acquire presigned upload URL from storage service.");
  }

  // 3. Binary PUT to Backblaze B2 with identical Content-Type header and AbortSignal support
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
    };

    const handleAbort = () => {
      xhr.abort();
    };

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Upload cancelled", "AbortError"));
        return;
      }
      signal.addEventListener("abort", handleAbort, { once: true });
    }

    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(
          new Error(
            `Storage bucket returned HTTP ${xhr.status} while uploading ${file.name}`
          )
        );
      }
    };

    xhr.onerror = () => {
      cleanup();
      reject(
        new Error(
          `Network error or CORS failure while uploading ${file.name} to storage bucket.`
        )
      );
    };

    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };

    xhr.send(file);
  });

  return {
    file_key: presigned.file_key,
    file_name: file.name,
    public_url: presigned.public_url ?? presigned.file_url,
  };
}
