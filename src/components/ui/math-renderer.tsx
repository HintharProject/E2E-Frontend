"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  className?: string;
}

interface Segment {
  type: "text" | "math-inline" | "math-block";
  value: string;
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Parse block math $$...$$ and inline math $...$
    const segments: Segment[] = [];

    // Check for display math blocks $$ ... $$
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        // text before block math
        const textBefore = content.substring(lastIndex, match.index);
        parseInlineMath(textBefore, segments);
      }
      segments.push({
        type: "math-block",
        value: match[1].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parseInlineMath(remainingText, segments);
    }

    return segments.map((seg, idx) => {
      if (seg.type === "math-block") {
        try {
          const html = katex.renderToString(seg.value, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <div
              key={idx}
              className="my-3 overflow-x-auto py-2 text-center text-ink"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <pre key={idx} className="my-2 rounded bg-muted/60 p-2 font-mono text-sm text-ink">
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
              className="inline-block px-1 align-baseline text-ink"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code key={idx} className="rounded bg-muted/50 px-1 font-mono text-xs text-ink">
              ${seg.value}$
            </code>
          );
        }
      }

      // regular text
      return (
        <span key={idx} className="whitespace-pre-wrap leading-relaxed">
          {seg.value}
        </span>
      );
    });
  }, [content]);

  return <div className={`text-sm text-ink ${className}`}>{renderedContent}</div>;
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
