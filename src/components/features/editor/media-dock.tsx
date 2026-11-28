"use client";

import * as React from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Paperclip,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StagedUploadItem } from "@/hooks/use-staged-uploads";
import {
  extractInlineImageRefs,
  isImageFileName,
} from "@/lib/inline-media";
import {
  formatBytes,
  inferContentType,
  UPLOAD_SCOPE_RULES,
  type UploadScope,
} from "@/lib/upload-rules";
import { cn } from "@/lib/utils";

export interface ExistingDockAttachment {
  id: string;
  file_name: string;
  file_url?: string | null;
  download_url?: string | null;
}

export interface MediaDockProps {
  scope: UploadScope;
  body: string;
  stagedItems: StagedUploadItem[];
  existingAttachments?: ExistingDockAttachment[];
  onAddFiles: (files: File[]) => Promise<unknown>;
  onRemoveStaged: (id: string) => void;
  onRetryStaged?: (id: string) => void;
  onDeleteExisting?: (attachment: ExistingDockAttachment) => void;
  onInsertInlineImage?: (fileName: string) => void;
  title?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function MediaDock({
  scope,
  body,
  stagedItems,
  existingAttachments = [],
  onAddFiles,
  onRemoveStaged,
  onRetryStaged,
  onDeleteExisting,
  onInsertInlineImage,
  title = "Media & Attachments",
  helperText,
  required = false,
  error,
  disabled = false,
}: MediaDockProps) {
  const rule = UPLOAD_SCOPE_RULES[scope];
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  // Maintain preview object URLs for staged image files
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

  const placedRefsLower = React.useMemo(
    () => new Set(extractInlineImageRefs(body).map((r) => r.toLowerCase())),
    [body]
  );

  const totalCount = existingAttachments.length + stagedItems.length;
  const remainingSlots = Math.max(0, rule.maxFiles - totalCount);
  const isAtCapacity = remainingSlots === 0;

  const existingImages = existingAttachments.filter((att) =>
    isImageFileName(att.file_name)
  );
  const existingDocuments = existingAttachments.filter(
    (att) => !isImageFileName(att.file_name)
  );
  const stagedImages = stagedItems.filter((item) =>
    inferContentType(item.file).startsWith("image/")
  );
  const stagedDocuments = stagedItems.filter(
    (item) => !inferContentType(item.file).startsWith("image/")
  );

  const handleIncoming = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    await onAddFiles(Array.from(files));
  };

  return (
    <section
      aria-label={title}
      className="mt-6 space-y-4 border-t border-border pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">
            {title}
            {required && (
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </h2>
        </div>

        <span className="font-mono tabular-nums text-xs text-muted-foreground">
          {totalCount} / {rule.maxFiles} files · Max {rule.maxSizeMB} MB{" "}
          {rule.sizeMode === "per-file" ? "each" : "total"}
        </span>
      </div>

      {/* Dropzone */}
      {!isAtCapacity && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragActive(false);
            void handleIncoming(e.dataTransfer.files);
          }}
          onClick={() => {
            if (!disabled) fileInputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isDragActive
              ? "border-primary bg-accent/40"
              : "border-border bg-card/60 hover:border-primary/50 hover:bg-card",
            disabled && "cursor-not-allowed opacity-60",
            error && "border-destructive/60"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={rule.maxFiles > 1}
            accept={rule.acceptString}
            disabled={disabled}
            onChange={(e) => {
              void handleIncoming(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
          />
          <UploadCloud className="size-5 text-primary" aria-hidden="true" />
          <p className="text-xs font-semibold text-foreground">
            Click or drop files to attach
          </p>
          {helperText && (
            <p className="max-w-lg text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {/* Images Dock (Existing + Staged) */}
      {(existingImages.length > 0 || stagedImages.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Images — insert into prose between paragraphs or keep at the top gallery
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {existingImages.map((att) => {
              const isPlaced = placedRefsLower.has(att.file_name.toLowerCase());
              const href = att.download_url || att.file_url || "";
              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {att.file_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={att.file_url}
                        alt=""
                        className="size-10 shrink-0 rounded-md border border-border bg-muted object-cover"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                        <ImageIcon className="size-4" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <a
                        href={href || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate font-mono text-xs font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {att.file_name}
                      </a>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge
                          variant={isPlaced ? "default" : "outline"}
                          className="h-5 px-2 text-xs"
                        >
                          {isPlaced ? "Placed inline" : "Top gallery"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {!isPlaced && onInsertInlineImage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={disabled}
                        onClick={() => onInsertInlineImage(att.file_name)}
                        className="min-h-[36px] sm:min-h-[28px] gap-1 text-xs"
                      >
                        <ImagePlus className="size-3 text-primary" aria-hidden="true" />
                        <span>Insert</span>
                      </Button>
                    )}
                    {onDeleteExisting && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={disabled}
                        onClick={() => onDeleteExisting(att)}
                        aria-label={`Delete ${att.file_name}`}
                        className="min-h-[36px] min-w-[36px] sm:min-h-[28px] sm:min-w-[28px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {stagedImages.map((item) => {
              const isPlaced = placedRefsLower.has(item.file.name.toLowerCase());
              const preview = previewUrls.get(item.file);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between gap-2.5 rounded-xl border bg-card p-2.5",
                    item.status === "error"
                      ? "border-destructive/50"
                      : "border-border"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt=""
                        className="size-10 shrink-0 rounded-md border border-border bg-muted object-cover"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                        <ImageIcon className="size-4" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-medium text-foreground">
                        {item.file.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          {formatBytes(item.file.size)}
                        </span>
                        {item.status === "optimizing" && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Loader2 className="size-3 animate-spin" />
                            Optimizing…
                          </span>
                        )}
                        {item.status === "uploading" && (
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-primary">
                            <Loader2 className="size-3 animate-spin" />
                            {item.progress}%
                          </span>
                        )}
                        {item.status === "uploaded" && (
                          <CheckCircle2 className="size-3 text-primary" />
                        )}
                        {item.status === "error" && (
                          <span className="text-destructive">
                            {item.error || "Failed"}
                          </span>
                        )}
                        {item.status !== "optimizing" &&
                          item.status !== "error" && (
                            <Badge
                              variant={isPlaced ? "default" : "outline"}
                              className="h-5 px-2 text-xs"
                            >
                              {isPlaced ? "Placed inline" : "Gallery"}
                            </Badge>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {item.status === "error" && onRetryStaged && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={disabled}
                        onClick={() => onRetryStaged(item.id)}
                        aria-label={`Retry upload ${item.file.name}`}
                        className="min-h-[36px] min-w-[36px] sm:min-h-[28px] sm:min-w-[28px]"
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                    {item.status !== "optimizing" &&
                      !isPlaced &&
                      onInsertInlineImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          disabled={disabled}
                          onClick={() => onInsertInlineImage(item.file.name)}
                          className="min-h-[36px] sm:min-h-[28px] gap-1 text-xs"
                        >
                          <ImagePlus
                            className="size-3 text-primary"
                            aria-hidden="true"
                          />
                          <span>Insert</span>
                        </Button>
                      )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={disabled || item.status === "optimizing"}
                      onClick={() => onRemoveStaged(item.id)}
                      aria-label={`Remove ${item.file.name}`}
                      className="min-h-[36px] min-w-[36px] sm:min-h-[28px] sm:min-w-[28px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Downloadable Non-Image Resources (Lessons) */}
      {(existingDocuments.length > 0 || stagedDocuments.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Downloadable Resources (shown in the Resources section below the lesson)
          </p>
          <ul className="space-y-2">
            {existingDocuments.map((att) => {
              const href = att.download_url || att.file_url || "";
              return (
                <li
                  key={att.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <FileText
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <a
                      href={href || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-foreground hover:text-primary hover:underline"
                    >
                      <span className="truncate">{att.file_name}</span>
                      <ExternalLink
                        className="size-3 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                  {onDeleteExisting && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={disabled}
                      onClick={() => onDeleteExisting(att)}
                      aria-label={`Delete ${att.file_name}`}
                      className="min-h-[36px] sm:min-h-[28px] gap-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </Button>
                  )}
                </li>
              );
            })}

            {stagedDocuments.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2",
                  item.status === "error"
                    ? "border-destructive/50"
                    : "border-border"
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <FileText
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {item.file.name}
                    </p>
                    <p className="font-mono tabular-nums text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                      {item.status === "uploading" && ` · ${item.progress}%`}
                      {item.status === "error" &&
                        ` · ${item.error || "Failed"}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.status === "error" && onRetryStaged && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={disabled}
                      onClick={() => onRetryStaged(item.id)}
                      aria-label={`Retry ${item.file.name}`}
                    >
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled}
                    onClick={() => onRemoveStaged(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
