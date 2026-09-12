"use client";

import React from "react";
import { Resource } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";
import { getFileExtension } from "@/lib/resources";
import { ExternalLink, Download, X, Check } from "lucide-react";

export interface ViewingDocument {
  title: string;
  url: string;
  downloadUrl?: string;
  paper?: Resource;
}

interface DocumentViewerModalProps {
  doc: ViewingDocument | null;
  onClose: () => void;
  onSelect?: (paper: Resource) => void;
}

export function DocumentViewerModal({ doc, onClose, onSelect }: DocumentViewerModalProps) {
  if (!doc) return null;

  const ext = getFileExtension(doc.title) || getFileExtension(doc.url.split("?")[0]);
  const isPdf = ext === ".pdf" || !ext;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-card border border-line rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-surface">
          <div className="flex items-center gap-2.5 min-w-0">
            <DocTypeIcon filename={doc.title} />
            <span className="font-semibold text-sm text-ink truncate">
              {doc.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Optional Select Action for problem creation flow */}
            {onSelect && doc.paper && (
              <Button
                size="sm"
                variant="default"
                className="h-8 px-3 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
                onClick={() => {
                  onSelect(doc.paper!);
                  onClose();
                }}
              >
                <Check className="size-3.5" />
                <span>Select This Paper</span>
              </Button>
            )}

            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-8 px-2.5 gap-1.5 text-xs font-medium",
              })}
            >
              <ExternalLink className="size-3.5" />
              <span>Open in Tab</span>
            </a>

            <a
              href={doc.downloadUrl || doc.url}
              download={doc.title}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "h-8 px-2.5 gap-1.5 text-xs font-medium",
              })}
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </a>

            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-ink-muted hover:text-ink"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Viewer Body: PDF Iframe or Document Fallback */}
        {isPdf ? (
          <div className="flex-1 w-full bg-muted/20">
            <iframe
              src={`${doc.url}#toolbar=1&navpanes=0`}
              className="w-full h-full border-none"
              title={doc.title}
            />
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-8 bg-muted/10 text-center gap-4">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <DocTypeIcon filename={doc.title} className="size-8" />
            </div>
            <div className="max-w-md flex flex-col gap-1">
              <h4 className="font-semibold text-ink text-base">{doc.title}</h4>
              <p className="text-xs text-ink-muted">
                This document format ({getFileExtension(doc.title).toUpperCase()}) can be downloaded directly or opened in an external viewer.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onSelect && doc.paper && (
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2"
                  onClick={() => {
                    onSelect(doc.paper!);
                    onClose();
                  }}
                >
                  <Check className="size-4" />
                  <span>Select This Paper</span>
                </Button>
              )}
              <a
                href={doc.downloadUrl || doc.url}
                download={doc.title}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "gap-2",
                })}
              >
                <Download className="size-4" />
                <span>Download File</span>
              </a>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "gap-2",
                })}
              >
                <ExternalLink className="size-4" />
                <span>Open Directly</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
