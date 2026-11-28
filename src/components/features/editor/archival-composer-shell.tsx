"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  Edit3,
  Eye,
  Loader2,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ArchivalComposerShellProps {
  backHref?: string;
  backLabel?: string;
  mode: "write" | "preview";
  onModeChange: (mode: "write" | "preview") => void;
  charCount: number;
  maxChars: number;
  submitLabel: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  isUploading?: boolean;
  onCancelUpload?: () => void;
  onCancel?: () => void;
  cancelHref?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stickyVariant?: "page" | "dialog";
  autosaveLabel?: string;
  draftBanner?: {
    visible: boolean;
    message?: string;
    missingMediaNote?: string;
    onDiscard: () => void;
    onDismiss: () => void;
  };
  errorBanner?: React.ReactNode;
  coldStartNotice?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ArchivalComposerShell({
  backHref,
  backLabel = "Back",
  mode,
  onModeChange,
  charCount,
  maxChars,
  submitLabel,
  isSubmitting = false,
  submitDisabled = false,
  isUploading = false,
  onCancelUpload,
  onCancel,
  cancelHref,
  onSubmit,
  stickyVariant = "page",
  autosaveLabel,
  draftBanner,
  errorBanner,
  coldStartNotice,
  headerExtra,
  children,
  className,
}: ArchivalComposerShellProps) {
  const baseId = React.useId();
  const writeTabRef = React.useRef<HTMLButtonElement>(null);
  const previewTabRef = React.useRef<HTMLButtonElement>(null);

  const nearLimit = maxChars > 0 && charCount >= maxChars * 0.9;
  const overLimit = maxChars > 0 && charCount > maxChars;

  const handleModeKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = mode === "write" ? "preview" : "write";
      onModeChange(next);
      if (next === "write") {
        writeTabRef.current?.focus();
      } else {
        previewTabRef.current?.focus();
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        "w-full",
        stickyVariant === "page" ? "mx-auto max-w-[52rem]" : "",
        className
      )}
    >
      {/* Sticky Compact Action Bar */}
      <div
        className={cn(
          "sticky z-20 border-b border-border backdrop-blur-md",
          stickyVariant === "page"
            ? "top-14 -mx-4 bg-background/90 px-4 py-2.5 sm:-mx-6 sm:px-6"
            : "top-0 -mx-6 bg-card/95 px-6 py-2.5"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="-ml-2 inline-flex min-h-[44px] sm:min-h-[34px] items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span>{backLabel}</span>
              </Link>
            ) : onCancel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
                className="min-h-[44px] sm:min-h-[34px] text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </Button>
            ) : null}

            {autosaveLabel && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-primary" aria-hidden="true" />
                <span>{autosaveLabel}</span>
              </span>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Composer mode"
              className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5"
            >
              <button
                ref={writeTabRef}
                type="button"
                role="tab"
                id={`${baseId}-write-tab`}
                aria-selected={mode === "write"}
                tabIndex={mode === "write" ? 0 : -1}
                onClick={() => onModeChange("write")}
                onKeyDown={handleModeKeyDown}
                className={cn(
                  "inline-flex min-h-[40px] sm:min-h-[30px] cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === "write"
                    ? "border border-border bg-card text-foreground shadow-2xs"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Edit3 className="size-3.5" aria-hidden="true" />
                <span>Write</span>
              </button>
              <button
                ref={previewTabRef}
                type="button"
                role="tab"
                id={`${baseId}-preview-tab`}
                aria-selected={mode === "preview"}
                tabIndex={mode === "preview" ? 0 : -1}
                onClick={() => onModeChange("preview")}
                onKeyDown={handleModeKeyDown}
                className={cn(
                  "inline-flex min-h-[40px] sm:min-h-[30px] cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === "preview"
                    ? "border border-border bg-card text-foreground shadow-2xs"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="size-3.5" aria-hidden="true" />
                <span>Preview</span>
              </button>
            </div>

            <span
              className={cn(
                "font-mono tabular-nums text-xs",
                overLimit
                  ? "font-semibold text-destructive"
                  : nearLimit
                    ? "font-semibold text-warning"
                    : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {charCount} / {maxChars}
            </span>

            {isUploading && onCancelUpload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelUpload}
                className="min-h-[40px] sm:min-h-[34px] text-xs"
              >
                Cancel upload
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={submitDisabled || isSubmitting}
              className="min-h-[40px] sm:min-h-[34px] gap-1.5 px-3.5 text-xs font-semibold"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <UploadCloud className="size-3.5" aria-hidden="true" />
              )}
              <span className={isUploading ? "font-mono tabular-nums" : undefined}>
                {submitLabel}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet Body */}
      <div className={cn("space-y-5", stickyVariant === "page" ? "pt-6 pb-8" : "pt-5 pb-2")}>
        {draftBanner?.visible && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs text-foreground"
          >
            <div className="space-y-0.5">
              <p className="font-medium">
                {draftBanner.message || "Restored unsaved draft from this browser session."}
              </p>
              {draftBanner.missingMediaNote && (
                <p className="text-muted-foreground">{draftBanner.missingMediaNote}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={draftBanner.onDiscard}
                className="min-h-[40px] sm:min-h-[28px] gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                <span>Discard</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={draftBanner.onDismiss}
                aria-label="Dismiss draft notice"
                className="min-h-[40px] min-w-[40px] sm:min-h-[28px] sm:min-w-[28px]"
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {errorBanner}
        {coldStartNotice}
        {headerExtra}

        {children}

        {(cancelHref || onCancel) && stickyVariant === "page" && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-4 sm:hidden">
            {cancelHref ? (
              <Button
                type="button"
                variant="secondary"
                nativeButton={false}
                disabled={isSubmitting}
                render={<Link href={cancelHref} />}
                className="min-h-[44px] flex-1"
              >
                Cancel
              </Button>
            ) : onCancel ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={onCancel}
                className="min-h-[44px] flex-1"
              >
                Cancel
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </form>
  );
}

export interface ArchivalTitleInputProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  maxLength?: number;
}

export const ArchivalTitleInput = React.forwardRef<
  HTMLTextAreaElement,
  ArchivalTitleInputProps
>(function ArchivalTitleInput(
  {
    value,
    onChange,
    error,
    hint,
    maxLength,
    placeholder = "Untitled",
    className,
    disabled,
    ...rest
  },
  forwardedRef
) {
  const localRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );

  React.useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="space-y-1.5 border-b border-border/70 pb-4">
      <textarea
        ref={setRefs}
        rows={1}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[\r\n]+/g, " "))}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent py-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-[1.2] text-foreground placeholder:text-muted-foreground/60 focus:outline-none scroll-mt-32",
          error && "text-destructive placeholder:text-destructive/50",
          className
        )}
        {...rest}
      />
      {(error || hint || typeof maxLength === "number") && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {error ? (
            <p role="alert" className="font-medium text-destructive">
              {error}
            </p>
          ) : hint ? (
            <p className="text-muted-foreground">{hint}</p>
          ) : (
            <span />
          )}
          {typeof maxLength === "number" && (
            <span className="ml-auto font-mono tabular-nums text-muted-foreground">
              {value.length} / {maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

