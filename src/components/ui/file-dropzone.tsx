"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import type { StagedUploadItem } from "@/hooks/use-staged-uploads";
import {
  formatBytes,
  getFileExtension,
  UPLOAD_SCOPE_RULES,
  UploadScope,
  validateFileBatch,
} from "@/lib/upload-rules";

export interface FileDropzoneProps {
  // Controlled staged-upload API
  items?: StagedUploadItem[];
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onAddFiles?: (
    files: File[]
  ) => void | Promise<{ errors?: string[] } | unknown>;
  onRemoveItem?: (id: string) => void;
  onRetryItem?: (id: string) => void;
  scope?: UploadScope;
  existingCount?: number;
  sizeMode?: "per-file" | "total";
  disabled?: boolean;
  label?: string;
  helperText?: string;
  className?: string;

  // Optional legacy compatibility props (to be removed after form migrations)
  onFilesSelected?: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  error?: string;
}

export function FileDropzone({
  items,
  files,
  onFilesChange,
  onAddFiles,
  onRemoveItem,
  onRetryItem,
  scope,
  existingCount = 0,
  sizeMode,
  disabled = false,
  label,
  helperText,
  className,
  onFilesSelected,
  maxFiles,
  maxSizeMB,
  acceptedTypes,
  error,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [legacyFiles, setLegacyFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string>("");
  const [previewUrls, setPreviewUrls] = useState<Map<File, string>>(
    () => new Map()
  );
  const urlsRef = useRef<Map<File, string>>(new Map());

  const rule = scope ? UPLOAD_SCOPE_RULES[scope] : undefined;
  const effectiveMaxFiles = maxFiles ?? rule?.maxFiles ?? 1;
  const effectiveMaxSizeMB = maxSizeMB ?? rule?.maxSizeMB ?? 5;
  const effectiveSizeMode = sizeMode ?? rule?.sizeMode ?? "per-file";
  const effectiveAccept = acceptedTypes?.join(",") ?? rule?.acceptString;

  const isItemsControlled = items !== undefined;
  const isFilesControlled = files !== undefined;

  const renderedItems: StagedUploadItem[] = useMemo(() => {
    if (items !== undefined) {
      return items;
    }
    const sourceFiles = files ?? legacyFiles;
    return sourceFiles.map((file, idx) => ({
      id: `${file.name}-${file.size}-${idx}`,
      file,
      status: "idle" as const,
      progress: 0,
    }));
  }, [items, files, legacyFiles]);

  const activeFiles = useMemo(
    () => renderedItems.map((item) => item.file),
    [renderedItems]
  );

  // Maintain object URLs per File reference and revoke removed/unmounted URLs
  useEffect(() => {
    const map = urlsRef.current;
    const activeSet = new Set(activeFiles);
    let changed = false;

    for (const file of activeFiles) {
      if (file.type.startsWith("image/") && !map.has(file)) {
        map.set(file, URL.createObjectURL(file));
        changed = true;
      }
    }

    for (const [file, url] of map.entries()) {
      if (!activeSet.has(file)) {
        URL.revokeObjectURL(url);
        map.delete(file);
        changed = true;
      }
    }

    if (changed) {
      setPreviewUrls(new Map(map));
    }
  }, [activeFiles]);

  useEffect(() => {
    const map = urlsRef.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);

  const currentCount = renderedItems.length;
  const totalCount = existingCount + currentCount;
  const totalBytes = useMemo(
    () => renderedItems.reduce((sum, item) => sum + item.file.size, 0),
    [renderedItems]
  );
  const isAtCapacity = totalCount >= effectiveMaxFiles;

  const validateIncoming = useCallback(
    (incoming: File[]): boolean => {
      if (totalCount + incoming.length > effectiveMaxFiles) {
        setLocalError(
          `Maximum ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"} allowed.`
        );
        return false;
      }

      if (scope) {
        const result = validateFileBatch(incoming, scope, totalCount, {
          existingBytes: totalBytes,
        });
        if (!result.valid) {
          setLocalError(result.error || "Invalid file selection.");
          return false;
        }
        setLocalError("");
        return true;
      }

      const maxBytes = effectiveMaxSizeMB * 1024 * 1024;
      let runningTotal = totalBytes;

      for (const file of incoming) {
        if (file.size <= 0) {
          setLocalError(`File "${file.name}" is empty (0 bytes).`);
          return false;
        }

        if (acceptedTypes && acceptedTypes.length > 0) {
          const fileExt = getFileExtension(file.name);
          const isValidType =
            (file.type && acceptedTypes.includes(file.type)) ||
            acceptedTypes.some(
              (type) =>
                (fileExt && fileExt === type.toLowerCase()) ||
                (fileExt && type.toLowerCase().includes(fileExt))
            );
          if (!isValidType) {
            setLocalError(
              `Invalid file type for "${file.name}". Accepted: ${acceptedTypes.join(", ")}`
            );
            return false;
          }
        }

        if (effectiveSizeMode === "per-file" && file.size > maxBytes) {
          setLocalError(
            `File "${file.name}" exceeds the ${effectiveMaxSizeMB} MB per-file limit.`
          );
          return false;
        }

        runningTotal += file.size;
      }

      if (effectiveSizeMode === "total" && runningTotal > maxBytes) {
        setLocalError(
          `Total file size (${formatBytes(runningTotal)}) must not exceed ${effectiveMaxSizeMB} MB.`
        );
        return false;
      }

      setLocalError("");
      return true;
    },
    [
      totalCount,
      effectiveMaxFiles,
      scope,
      totalBytes,
      effectiveMaxSizeMB,
      acceptedTypes,
      effectiveSizeMode,
    ]
  );

  const processIncomingFiles = useCallback(
    async (incoming: File[]) => {
      if (disabled || incoming.length === 0) return;

      if (onAddFiles) {
        if (totalCount + incoming.length > effectiveMaxFiles) {
          setLocalError(
            `Maximum ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"} allowed.`
          );
          return;
        }
        setLocalError("");
        const result = await onAddFiles(incoming);
        if (
          result &&
          typeof result === "object" &&
          "errors" in result &&
          Array.isArray((result as { errors?: string[] }).errors)
        ) {
          const errs = (result as { errors: string[] }).errors;
          if (errs.length > 0) {
            setLocalError(errs[0]);
          }
        }
        return;
      }

      if (!validateIncoming(incoming)) {
        return;
      }

      const currentFiles = files ?? legacyFiles;
      const nextFiles = [...currentFiles, ...incoming];

      if (!isFilesControlled && !isItemsControlled) {
        setLegacyFiles(nextFiles);
      }
      onFilesChange?.(nextFiles);
      onFilesSelected?.(nextFiles);
    },
    [
      disabled,
      onAddFiles,
      totalCount,
      effectiveMaxFiles,
      validateIncoming,
      files,
      legacyFiles,
      isFilesControlled,
      isItemsControlled,
      onFilesChange,
      onFilesSelected,
    ]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        void processIncomingFiles(Array.from(e.dataTransfer.files));
      }
    },
    [disabled, processIncomingFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void processIncomingFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleRemove = (item: StagedUploadItem, index: number) => {
    setLocalError("");
    if (onRemoveItem) {
      onRemoveItem(item.id);
      return;
    }

    const currentFiles = files ?? legacyFiles;
    const nextFiles = currentFiles.filter((_, idx) => idx !== index);
    if (!isFilesControlled && !isItemsControlled) {
      setLegacyFiles(nextFiles);
    }
    onFilesChange?.(nextFiles);
    onFilesSelected?.(nextFiles);
  };

  const displayError = error || localError;
  const acceptsSummary =
    rule?.allowedExtensions.join(", ") ??
    acceptedTypes?.join(", ") ??
    "Supported files";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative flex min-h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50",
          displayError && "border-destructive bg-destructive/10",
          (disabled || isAtCapacity) && "opacity-60 cursor-not-allowed"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isAtCapacity) {
            setIsDragActive(true);
          }
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
      >
        <UploadCloud
          className="mb-2 size-7 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mb-1 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Click to upload</span>{" "}
          or drag and drop
        </p>
        <p className="text-center text-xs text-muted-foreground">
          {helperText || acceptsSummary}
        </p>
        <p className="mt-1.5 text-center font-mono tabular-nums text-xs text-muted-foreground">
          {effectiveSizeMode === "total"
            ? `${totalCount} / ${effectiveMaxFiles} files · ${formatBytes(totalBytes)} / ${effectiveMaxSizeMB} MB`
            : `${totalCount} / ${effectiveMaxFiles} ${effectiveMaxFiles === 1 ? "file" : "files"} · Max ${effectiveMaxSizeMB} MB each`}
        </p>

        <input
          type="file"
          aria-label={label || "Upload files"}
          disabled={disabled || isAtCapacity}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          multiple={effectiveMaxFiles > 1}
          accept={effectiveAccept}
          onChange={handleFileInput}
          title=""
        />
      </div>

      {displayError && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-2 text-xs font-medium text-destructive"
        >
          {displayError}
        </p>
      )}

      {renderedItems.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {renderedItems.map((item, idx) => {
            const previewUrl = previewUrls.get(item.file) ?? null;
            const extLabel =
              getFileExtension(item.file.name).replace(".", "") || "FILE";

            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2.5 text-sm"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={item.file.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="size-10 shrink-0 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                        <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
                          {extLabel}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.file.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          {formatBytes(item.file.size)}
                        </span>
                        {item.status === "optimizing" && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Loader2
                              className="size-3 animate-spin"
                              aria-hidden="true"
                            />
                            Optimizing…
                          </span>
                        )}
                        {item.status === "uploaded" && (
                          <span className="inline-flex items-center gap-1 font-medium text-primary">
                            <CheckCircle2
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {item.status === "error" && onRetryItem && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => onRetryItem(item.id)}
                        className="min-h-[36px] sm:min-h-[28px] gap-1"
                      >
                        <RotateCcw className="size-3" aria-hidden="true" />
                        <span>Retry</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(item, idx)}
                      aria-label={`Remove ${item.file.name}`}
                      className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {item.status === "uploading" && (
                  <div className="flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-valuenow={item.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Upload progress for ${item.file.name}`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono tabular-nums text-xs text-muted-foreground">
                      {item.progress}%
                    </span>
                  </div>
                )}

                {item.status === "error" && item.error && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {item.error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
