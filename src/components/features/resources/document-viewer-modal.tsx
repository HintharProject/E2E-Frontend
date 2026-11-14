"use client";

import React from "react";
import Link from "next/link";
import { Resource } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";
import { getFileExtension } from "@/lib/resources";
import { ArrowUpRight, Check, Download, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

/**
 * Accessible modal PDF/document previewer for Past Papers and Textbooks.
 * Uses Base UI Dialog for focus trapping, backdrop blur, and Escape key dismissal.
 */
export function DocumentViewerModal({ doc, onClose, onSelect }: DocumentViewerModalProps) {
  const ext = doc ? getFileExtension(doc.title) || getFileExtension(doc.url.split("?")[0]) : "";
  const isPdf = ext === ".pdf" || !ext;

  return (
    <Dialog open={Boolean(doc)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-5xl sm:max-w-5xl h-[90vh] max-h-[920px] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-modal flex flex-col"
      >
        {doc && (
          <>
            {/* Modal Header */}
            <DialogHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border bg-muted/40 shrink-0 space-y-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <DocTypeIcon filename={doc.title} resourceType={doc.paper?.resource_type} />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <DialogTitle className="font-heading font-semibold text-sm text-foreground truncate">
                    {doc.title}
                  </DialogTitle>
                  {doc.paper?.paper_type && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold uppercase shrink-0",
                        doc.paper.paper_type === "QP"
                          ? "border-primary/35 bg-primary/10 text-primary"
                          : "border-border bg-secondary text-secondary-foreground"
                      )}
                    >
                      {doc.paper.paper_type}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {onSelect && doc.paper && (
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5 font-semibold"
                    onClick={() => {
                      onSelect(doc.paper!);
                      onClose();
                    }}
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    <span>Select Paper</span>
                  </Button>
                )}

                {doc.paper && doc.paper.resource_type === "PAST_PAPER" && (
                  <Link
                    href={`/train/${doc.paper.id}`}
                    className={buttonVariants({
                      variant: onSelect ? "outline" : "default",
                      size: "sm",
                      className: "gap-1 font-semibold",
                    })}
                    onClick={onClose}
                  >
                    <span>Train!</span>
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                )}

                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "hidden sm:inline-flex gap-1.5 font-medium",
                  })}
                  aria-label="Open document in new browser tab"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span>New Tab</span>
                </a>

                <a
                  href={doc.downloadUrl || doc.url}
                  download={doc.title}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                    className: "gap-1.5 font-medium",
                  })}
                  aria-label={`Download ${doc.title}`}
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={onClose}
                  aria-label="Close document preview"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </DialogHeader>

            {/* Viewer Body */}
            {isPdf ? (
              <div className="flex-1 w-full bg-muted/25">
                <iframe
                  src={`${doc.url}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-none"
                  title={doc.title}
                />
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col items-center justify-center p-8 bg-muted/15 text-center gap-4">
                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <DocTypeIcon filename={doc.title} resourceType={doc.paper?.resource_type} className="size-8" />
                </div>
                <div className="max-w-md flex flex-col gap-1.5">
                  <h4 className="font-heading font-semibold text-foreground text-base text-balance">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This document format ({ext ? ext.replace(".", "").toUpperCase() : "FILE"}) cannot be previewed inline. Download it directly or open it in a new tab.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {onSelect && doc.paper && (
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1.5"
                      onClick={() => {
                        onSelect(doc.paper!);
                        onClose();
                      }}
                    >
                      <Check className="size-4" aria-hidden="true" />
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
                      className: "gap-1.5",
                    })}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    <span>Download File</span>
                  </a>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "gap-1.5",
                    })}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    <span>Open Directly</span>
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
