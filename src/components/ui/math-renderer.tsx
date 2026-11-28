"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Expand, Image as ImageIcon } from "lucide-react";
import {
  decodeInlineImageRef,
  getAttachmentDisplayName,
  getAttachmentPreviewUrl,
  INLINE_IMAGE_TOKEN_REGEX,
  resolveAttachmentForRef,
  type MediaAttachmentLike,
} from "@/lib/inline-media";

interface MathRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
  attachments?: MediaAttachmentLike[];
  onInlineImageClick?: (attachmentIdOrRef: string, index: number) => void;
}

type Segment =
  | { type: "text"; value: string }
  | { type: "math-inline"; value: string }
  | { type: "math-block"; value: string }
  | { type: "inline-image"; imageRef: string; caption: string };

export function MathRenderer({
  content,
  className = "",
  compact = false,
  attachments = [],
  onInlineImageClick,
}: MathRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    const segments = parseContentWithInlineMedia(content);
    let renderedImageCursor = 0;

    return segments.map((seg, idx) => {
      if (seg.type === "inline-image") {
        if (compact) {
          const label = seg.caption
            ? `Diagram: ${seg.caption}`
            : "Diagram";
          return (
            <span
              key={idx}
              className="mx-1 inline-flex max-w-full items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 align-middle text-xs font-medium text-muted-foreground"
            >
              <ImageIcon className="size-3 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </span>
          );
        }

        const resolved = resolveAttachmentForRef(seg.imageRef, attachments);
        const src = resolved ? getAttachmentPreviewUrl(resolved) : "";
        if (!src) {
          return null;
        }

        const resolvedIndex = resolved
          ? attachments.indexOf(resolved)
          : renderedImageCursor;
        const clickIndex =
          resolvedIndex >= 0 ? resolvedIndex : renderedImageCursor;
        renderedImageCursor += 1;

        const altText =
          seg.caption ||
          (resolved ? getAttachmentDisplayName(resolved) : seg.imageRef);
        const targetId = resolved?.id || seg.imageRef;

        return (
          <figure
            key={idx}
            className="my-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            {onInlineImageClick ? (
              <button
                type="button"
                onClick={() => onInlineImageClick(targetId, clickIndex)}
                aria-label={`View full size image: ${altText}`}
                className="group relative block w-full cursor-pointer bg-muted/20 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={altText}
                  loading="lazy"
                  className="mx-auto max-h-[520px] w-full object-contain transition-opacity duration-200"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-popover/90 px-2.5 py-1 text-xs font-medium text-foreground opacity-0 shadow-sm backdrop-blur-xs transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Expand className="size-3.5 text-primary" />
                  <span>Zoom</span>
                </span>
              </button>
            ) : (
              <div className="bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={altText}
                  loading="lazy"
                  className="mx-auto max-h-[520px] w-full object-contain"
                />
              </div>
            )}
            {seg.caption && (
              <figcaption className="border-t border-border/70 bg-muted/20 px-4 py-2 text-xs leading-relaxed text-muted-foreground">
                {seg.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      if (seg.type === "math-block") {
        try {
          const html = katex.renderToString(seg.value, {
            displayMode: !compact,
            throwOnError: false,
          });
          if (compact) {
            return (
              <span
                key={idx}
                className="mx-1 inline-block max-w-full overflow-x-auto align-middle text-foreground"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return (
            <div
              key={idx}
              className="my-3 overflow-x-auto py-2 text-center text-foreground"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          if (compact) {
            return (
              <code
                key={idx}
                className="mx-1 rounded bg-muted/60 px-1 font-mono text-xs text-foreground"
              >
                $${seg.value}$$
              </code>
            );
          }
          return (
            <pre
              key={idx}
              className="my-2 rounded bg-muted/60 p-2 font-mono text-sm text-foreground"
            >
              {seg.value}
            </pre>
          );
        }
      }

      if (seg.type === "math-inline") {
        try {
          const html = katex.renderToString(seg.value, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={idx}
              className="inline-block px-1 align-baseline text-foreground"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code
              key={idx}
              className="rounded bg-muted/50 px-1 font-mono text-xs text-foreground"
            >
              ${seg.value}$
            </code>
          );
        }
      }

      return (
        <span key={idx} className="whitespace-pre-wrap leading-relaxed">
          {seg.value}
        </span>
      );
    });
  }, [content, compact, attachments, onInlineImageClick]);

  return (
    <div className={`text-sm text-foreground ${className}`}>
      {renderedContent}
    </div>
  );
}

function parseContentWithInlineMedia(content: string): Segment[] {
  const segments: Segment[] = [];
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let textLines: string[] = [];

  const flushTextLines = () => {
    if (textLines.length === 0) return;
    let start = 0;
    let end = textLines.length;
    while (start < end && textLines[start].trim() === "") start += 1;
    while (end > start && textLines[end - 1].trim() === "") end -= 1;
    const chunk = textLines.slice(start, end).join("\n");
    textLines = [];
    if (chunk.length > 0) {
      parseMathBlocks(chunk, segments);
    }
  };

  for (const line of lines) {
    const imgMatch = line.trim().match(INLINE_IMAGE_TOKEN_REGEX);
    if (imgMatch) {
      flushTextLines();
      segments.push({
        type: "inline-image",
        caption: imgMatch[1].trim(),
        imageRef: decodeInlineImageRef(imgMatch[2]),
      });
    } else {
      textLines.push(line);
    }
  }

  flushTextLines();
  return segments;
}

function parseMathBlocks(chunk: string, segments: Segment[]) {
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(chunk)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = chunk.substring(lastIndex, match.index);
      parseInlineMath(textBefore, segments);
    }
    segments.push({
      type: "math-block",
      value: match[1].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < chunk.length) {
    const remainingText = chunk.substring(lastIndex);
    parseInlineMath(remainingText, segments);
  }
}

function parseInlineMath(text: string, segments: Segment[]) {
  const inlineRegex = /\$([^\$\n]+?)\$/g;
  let lastIdx = 0;
  let inlineMatch: RegExpExecArray | null;

  while ((inlineMatch = inlineRegex.exec(text)) !== null) {
    if (inlineMatch.index > lastIdx) {
      segments.push({
        type: "text",
        value: text.substring(lastIdx, inlineMatch.index),
      });
    }
    segments.push({
      type: "math-inline",
      value: inlineMatch[1].trim(),
    });
    lastIdx = inlineMatch.index + inlineMatch[0].length;
  }

  if (lastIdx < text.length) {
    segments.push({
      type: "text",
      value: text.substring(lastIdx),
    });
  }
}
