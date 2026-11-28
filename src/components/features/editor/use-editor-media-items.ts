"use client";

import * as React from "react";
import type { StagedUploadItem } from "@/hooks/use-staged-uploads";
import type { BlockEditorMediaItem } from "./block-document-editor";
import { isImageFileName } from "@/lib/inline-media";
import { inferContentType } from "@/lib/upload-rules";

export interface ExistingEditorAttachment {
  id: string;
  file_name: string;
  file_url?: string | null;
  attachment_url?: string | null;
  download_url?: string | null;
}

/**
 * Combines persisted image attachments and locally staged image files (with managed ObjectURLs)
 * into a single list for `BlockDocumentEditor` previews and lightboxes.
 */
export function useEditorMediaItems(
  stagedItems: StagedUploadItem[],
  existingAttachments: ExistingEditorAttachment[] = []
): BlockEditorMediaItem[] {
  const urlMapRef = React.useRef<Map<File, string>>(new Map());
  const [previewUrls, setPreviewUrls] = React.useState<Map<File, string>>(
    () => new Map()
  );

  React.useEffect(() => {
    const map = urlMapRef.current;
    const activeFiles = new Set(stagedItems.map((i) => i.file));
    let changed = false;

    for (const file of activeFiles) {
      if (inferContentType(file).startsWith("image/") && !map.has(file)) {
        map.set(file, URL.createObjectURL(file));
        changed = true;
      }
    }

    for (const [file, url] of map.entries()) {
      if (!activeFiles.has(file)) {
        URL.revokeObjectURL(url);
        map.delete(file);
        changed = true;
      }
    }

    if (changed) {
      setPreviewUrls(new Map(map));
    }
  }, [stagedItems]);

  React.useEffect(() => {
    const map = urlMapRef.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);

  return React.useMemo<BlockEditorMediaItem[]>(() => {
    const persisted: BlockEditorMediaItem[] = existingAttachments
      .filter((att) => isImageFileName(att.file_name))
      .map((att) => ({
        id: att.id,
        file_name: att.file_name,
        file_url: att.file_url,
        attachment_url: att.attachment_url,
        download_url: att.download_url,
        previewUrl: (att.attachment_url || att.file_url || "").trim(),
        status: "existing" as const,
      }));

    const staged: BlockEditorMediaItem[] = stagedItems
      .filter((item) => inferContentType(item.file).startsWith("image/"))
      .map((item) => {
        const preview = previewUrls.get(item.file) || "";
        return {
          id: item.id,
          file_name: item.file.name,
          file_url: preview,
          attachment_url: preview,
          previewUrl: preview,
          sizeBytes: item.file.size,
          status: item.status,
          progress: item.progress,
        };
      });

    return [...persisted, ...staged];
  }, [existingAttachments, stagedItems, previewUrls]);
}

