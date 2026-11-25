"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { uploadDirectlyToB2 } from "@/lib/storage";
import {
  UPLOAD_SCOPE_RULES,
  UploadScope,
  validateFileBatch,
} from "@/lib/upload-rules";
import {
  inspectImageGeometry,
  MAX_RAW_IMAGE_BYTES,
} from "@/components/features/problems/canvas-geometry-inspector";

export type StagedUploadStatus =
  | "idle"
  | "optimizing"
  | "uploading"
  | "uploaded"
  | "error";

export interface StagedUploadItem {
  id: string;
  file: File;
  status: StagedUploadStatus;
  progress: number;
  error?: string;
  uploaded?: {
    file_key: string;
    file_name: string;
    public_url?: string;
  };
}

export interface UseStagedUploadsOptions {
  scope: UploadScope;
  existingCount?: number;
  optimizeImages?: boolean;
  maxConcurrency?: number;
}

export interface AddFilesResult {
  added: StagedUploadItem[];
  errors: string[];
}

function createItemId(file: File): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `${file.name}-${file.size}-${rand}`;
}

export function useStagedUploads({
  scope,
  existingCount = 0,
  optimizeImages = false,
  maxConcurrency = 2,
}: UseStagedUploadsOptions) {
  const [items, setItems] = useState<StagedUploadItem[]>([]);
  const [batchError, setBatchError] = useState<string>("");

  const itemsRef = useRef<StagedUploadItem[]>(items);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const commitItems = useCallback(
    (updater: (prev: StagedUploadItem[]) => StagedUploadItem[]) => {
      const next = updater(itemsRef.current);
      itemsRef.current = next;
      setItems(next);
      return next;
    },
    []
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<StagedUploadItem>) => {
      commitItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    [commitItems]
  );

  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      controllers.forEach((ctrl) => ctrl.abort());
      controllers.clear();
    };
  }, []);

  const addFiles = useCallback(
    async (incoming: File[]): Promise<AddFilesResult> => {
      if (!incoming || incoming.length === 0) {
        return { added: [], errors: [] };
      }

      setBatchError("");
      const currentItems = itemsRef.current;
      const currentBytes = currentItems.reduce((sum, i) => sum + i.file.size, 0);

      const batchCheck = validateFileBatch(
        incoming,
        scope,
        existingCount + currentItems.length,
        {
          existingBytes: currentBytes,
          maxSizeOverrideMB: optimizeImages
            ? MAX_RAW_IMAGE_BYTES / (1024 * 1024)
            : undefined,
        }
      );

      if (!batchCheck.valid) {
        const msg = batchCheck.error || "Invalid file selection.";
        setBatchError(msg);
        return { added: [], errors: [msg] };
      }

      if (!optimizeImages) {
        const newItems: StagedUploadItem[] = incoming.map((file) => ({
          id: createItemId(file),
          file,
          status: "idle",
          progress: 0,
        }));
        commitItems((prev) => [...prev, ...newItems]);
        return { added: newItems, errors: [] };
      }

      const placeholders: StagedUploadItem[] = incoming.map((file) => ({
        id: createItemId(file),
        file,
        status: "optimizing",
        progress: 0,
      }));
      commitItems((prev) => [...prev, ...placeholders]);

      const added: StagedUploadItem[] = [];
      const errors: string[] = [];

      for (const placeholder of placeholders) {
        const result = await inspectImageGeometry(placeholder.file);
        if (!result.isValid) {
          const errMsg =
            result.error || `Invalid image: ${placeholder.file.name}`;
          errors.push(errMsg);
          commitItems((prev) => prev.filter((i) => i.id !== placeholder.id));
        } else {
          const finalized: StagedUploadItem = {
            ...placeholder,
            file: result.file,
            status: "idle",
            progress: 0,
            error: undefined,
          };
          updateItem(placeholder.id, finalized);
          added.push(finalized);
        }
      }

      if (errors.length > 0) {
        setBatchError(errors[0]);
      }

      return { added, errors };
    },
    [scope, existingCount, optimizeImages, commitItems, updateItem]
  );

  const removeFile = useCallback(
    (id: string) => {
      const controller = controllersRef.current.get(id);
      if (controller) {
        controller.abort();
        controllersRef.current.delete(id);
      }
      setBatchError("");
      commitItems((prev) => prev.filter((item) => item.id !== id));
    },
    [commitItems]
  );

  const cancelUpload = useCallback(
    (id?: string) => {
      if (id) {
        const controller = controllersRef.current.get(id);
        if (controller) {
          controller.abort();
          controllersRef.current.delete(id);
        }
        commitItems((prev) =>
          prev.map((item) =>
            item.id === id && item.status === "uploading"
              ? {
                  ...item,
                  status: "error",
                  progress: 0,
                  error: "Upload cancelled",
                }
              : item
          )
        );
        return;
      }

      controllersRef.current.forEach((ctrl) => ctrl.abort());
      controllersRef.current.clear();
      commitItems((prev) =>
        prev.map((item) =>
          item.status === "uploading"
            ? {
                ...item,
                status: "error",
                progress: 0,
                error: "Upload cancelled",
              }
            : item
        )
      );
    },
    [commitItems]
  );

  const uploadSingleItem = useCallback(
    async (item: StagedUploadItem, token: string | null) => {
      const controller = new AbortController();
      controllersRef.current.set(item.id, controller);

      updateItem(item.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
      });

      try {
        const uploaded = await uploadDirectlyToB2(item.file, scope, token, {
          signal: controller.signal,
          onProgress: (percent) => {
            if (controllersRef.current.get(item.id) !== controller) return;
            updateItem(item.id, { progress: percent });
          },
        });

        if (controllersRef.current.get(item.id) !== controller) return;
        updateItem(item.id, {
          status: "uploaded",
          progress: 100,
          error: undefined,
          uploaded,
        });
      } catch (err: unknown) {
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        const msg = isAbort
          ? "Upload cancelled"
          : err instanceof Error
            ? err.message
            : "Upload failed";
        if (controllersRef.current.get(item.id) === controller) {
          updateItem(item.id, {
            status: "error",
            progress: 0,
            error: msg,
          });
        }
        throw new Error(msg);
      } finally {
        if (controllersRef.current.get(item.id) === controller) {
          controllersRef.current.delete(item.id);
        }
      }
    },
    [scope, updateItem]
  );

  const uploadAll = useCallback(
    async (
      getToken: () => Promise<string | null>
    ): Promise<Array<{ file_key: string; file_name: string; public_url?: string }>> => {
      setBatchError("");
      const snapshot = itemsRef.current;

      if (snapshot.some((item) => item.status === "optimizing")) {
        throw new Error("Please wait for image optimization to finish.");
      }

      const pending = snapshot.filter(
        (item) => item.status !== "uploaded" || !item.uploaded
      );

      if (pending.length === 0) {
        return snapshot
          .map((item) => item.uploaded)
          .filter(
            (u): u is { file_key: string; file_name: string; public_url?: string } =>
              Boolean(u)
          );
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required. Please sign in and retry.");
      }

      const concurrency = Math.max(1, maxConcurrency);
      let cursor = 0;
      const errors: string[] = [];

      const worker = async () => {
        while (cursor < pending.length) {
          const nextIdx = cursor++;
          const target = pending[nextIdx];
          if (!target) break;
          try {
            await uploadSingleItem(target, token);
          } catch (err: unknown) {
            errors.push(
              err instanceof Error ? err.message : "Upload failed"
            );
          }
        }
      };

      const workers = Array.from(
        { length: Math.min(concurrency, pending.length) },
        () => worker()
      );
      await Promise.all(workers);

      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      const finalSnapshot = itemsRef.current;
      const failed = finalSnapshot.find(
        (item) => item.status !== "uploaded" || !item.uploaded
      );
      if (failed) {
        throw new Error(
          failed.error || `Failed to upload ${failed.file.name}.`
        );
      }

      return finalSnapshot.map((item) => item.uploaded!);
    },
    [maxConcurrency, uploadSingleItem]
  );

  const retryItem = useCallback(
    async (id: string, getToken: () => Promise<string | null>) => {
      const target = itemsRef.current.find((item) => item.id === id);
      if (!target || target.status === "uploaded" || target.status === "uploading") {
        return;
      }

      setBatchError("");
      const token = await getToken();
      if (!token) {
        const msg = "Authentication required. Please sign in and retry.";
        updateItem(id, { status: "error", error: msg });
        setBatchError(msg);
        return;
      }

      try {
        await uploadSingleItem(target, token);
      } catch (err: unknown) {
        setBatchError(
          err instanceof Error ? err.message : "Failed to retry upload."
        );
      }
    },
    [uploadSingleItem, updateItem]
  );

  const reset = useCallback(() => {
    controllersRef.current.forEach((ctrl) => ctrl.abort());
    controllersRef.current.clear();
    setBatchError("");
    commitItems(() => []);
  }, [commitItems]);

  const rule = UPLOAD_SCOPE_RULES[scope];
  const isUploading = items.some((i) => i.status === "uploading");
  const isOptimizing = items.some((i) => i.status === "optimizing");
  const totalBytes = items.reduce((sum, i) => sum + i.file.size, 0);

  return {
    items,
    rule,
    batchError,
    setBatchError,
    isUploading,
    isOptimizing,
    totalBytes,
    addFiles,
    removeFile,
    cancelUpload,
    uploadAll,
    retryItem,
    reset,
  };
}
