import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

function resolveDownloadFilename(filename: string, url: string, mimeType?: string): string {
  const base = filename?.trim() || "download";
  if (/\.[a-z0-9]{2,5}$/i.test(base)) return base;
  try {
    const pathName = new URL(url, "https://placeholder.local").pathname;
    const extMatch = pathName.match(/\.([a-z0-9]{2,5})$/i);
    if (extMatch) return `${base}.${extMatch[1].toLowerCase()}`;
  } catch {
    // Ignore URL parse error
  }
  const mimeExt = mimeType ? MIME_EXT_MAP[mimeType.split(";")[0].trim().toLowerCase()] : undefined;
  return mimeExt ? `${base}.${mimeExt}` : base;
}

/**
 * Downloads a file via CORS Blob fetch so cross-origin URLs save to disk
 * instead of opening in a new browser tab. Falls back cleanly if CORS blocks fetch.
 */
export async function triggerFileDownload(url: string, filename = "download"): Promise<void> {
  if (!url) return;
  try {
    const response = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const resolvedName = resolveDownloadFilename(filename, url, blob.type);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = resolvedName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    const resolvedName = resolveDownloadFilename(filename, url);
    const hasAttachmentDisposition = /response-content-disposition=attachment/i.test(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = resolvedName;
    if (!hasAttachmentDisposition) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
