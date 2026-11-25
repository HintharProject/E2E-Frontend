"use client";

import * as React from "react";
import { Edit3, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MathRenderer } from "@/components/ui/math-renderer";
import { cn } from "@/lib/utils";

export interface MarkdownMathEditorProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
  textareaClassName?: string;
}

export const MarkdownMathEditor = React.forwardRef<
  HTMLTextAreaElement,
  MarkdownMathEditorProps
>(function MarkdownMathEditor(
  {
    id,
    name,
    value,
    onChange,
    onBlur,
    placeholder = "Write your explanation. Markdown and LaTeX formulas are supported...",
    maxLength,
    rows = 6,
    disabled = false,
    required = false,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    className,
    textareaClassName,
  },
  ref
) {
  const [tab, setTab] = React.useState<"write" | "preview">("write");
  const baseId = React.useId();
  const writeTabId = `${baseId}-write-tab`;
  const previewTabId = `${baseId}-preview-tab`;
  const writePanelId = `${baseId}-write-panel`;
  const previewPanelId = `${baseId}-preview-panel`;

  const writeTabRef = React.useRef<HTMLButtonElement>(null);
  const previewTabRef = React.useRef<HTMLButtonElement>(null);

  const length = value?.length ?? 0;
  const nearLimit =
    typeof maxLength === "number" && maxLength > 0 && length >= maxLength * 0.9;
  const overLimit =
    typeof maxLength === "number" && maxLength > 0 && length > maxLength;

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextTab = tab === "write" ? "preview" : "write";
      setTab(nextTab);
      if (nextTab === "write") {
        writeTabRef.current?.focus();
      } else {
        previewTabRef.current?.focus();
      }
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Editor mode"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
        >
          <button
            ref={writeTabRef}
            type="button"
            role="tab"
            id={writeTabId}
            aria-selected={tab === "write"}
            aria-controls={writePanelId}
            tabIndex={tab === "write" ? 0 : -1}
            onClick={() => setTab("write")}
            onKeyDown={handleTabKeyDown}
            className={cn(
              "inline-flex min-h-[44px] sm:min-h-[32px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              tab === "write"
                ? "bg-card text-foreground shadow-2xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="size-3.5" aria-hidden="true" />
            <span>Write</span>
          </button>

          <button
            ref={previewTabRef}
            type="button"
            role="tab"
            id={previewTabId}
            aria-selected={tab === "preview"}
            aria-controls={previewPanelId}
            tabIndex={tab === "preview" ? 0 : -1}
            onClick={() => setTab("preview")}
            onKeyDown={handleTabKeyDown}
            className={cn(
              "inline-flex min-h-[44px] sm:min-h-[32px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              tab === "preview"
                ? "bg-card text-foreground shadow-2xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="size-3.5" aria-hidden="true" />
            <span>Preview</span>
          </button>
        </div>

        {typeof maxLength === "number" && (
          <span
            className={cn(
              "font-mono tabular-nums text-xs",
              overLimit
                ? "font-semibold text-destructive"
                : nearLimit
                  ? "font-medium text-warning"
                  : "text-muted-foreground"
            )}
          >
            {length}/{maxLength}
          </span>
        )}
      </div>

      <div
        id={writePanelId}
        role="tabpanel"
        aria-labelledby={writeTabId}
        className={cn(tab !== "write" && "hidden")}
      >
        <Textarea
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={cn("text-base sm:text-sm min-h-[160px]", textareaClassName)}
        />
      </div>

      {tab === "preview" && (
        <div
          id={previewPanelId}
          role="tabpanel"
          aria-labelledby={previewTabId}
          className="min-h-[160px] w-full overflow-x-auto [overflow-wrap:anywhere] rounded-lg border border-input bg-card p-3.5 text-sm leading-relaxed text-foreground"
        >
          {value.trim() ? (
            <MathRenderer content={value} />
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Nothing to preview yet. Switch to Write to compose your content.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Supports Markdown &amp; LaTeX:{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
          $x^2$
        </code>
        ,{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
          {`$$\\frac{a}{b}$$`}
        </code>
      </p>
    </div>
  );
});

MarkdownMathEditor.displayName = "MarkdownMathEditor";
