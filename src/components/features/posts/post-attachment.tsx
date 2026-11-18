"use client";

import { useMemo, useState } from "react";
import { Download, File as FileIcon, Loader2 } from "lucide-react";
import {
  ImageLightbox,
  ImagePreviewFrame,
  type LightboxImageItem,
} from "@/components/ui/image-lightbox";
import { cn, triggerFileDownload } from "@/lib/utils";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

function getFileInfo(url: string, overrideFilename?: string) {
  let extractedFilename = "attachment";
  let urlExt = "";

  if (url) {
    try {
      const rawSegment =
        new URL(url, "https://placeholder.local").pathname.split("/").pop() || "attachment";
      try {
        extractedFilename = decodeURIComponent(rawSegment);
      } catch {
        extractedFilename = rawSegment;
      }
      urlExt = extractedFilename.split(".").pop()?.toLowerCase() || "";
    } catch {
      extractedFilename = "attachment";
    }
  }

  const filename = overrideFilename?.trim() || extractedFilename;
  const overrideExt = filename.split("?")[0].split(".").pop()?.toLowerCase() || "";
  const isImage = IMAGE_EXTENSIONS.has(overrideExt) || IMAGE_EXTENSIONS.has(urlExt);

  return { filename, isImage };
}

export function PostAttachment({
  url,
  downloadUrl,
  filename: overrideFilename,
}: {
  url: string;
  downloadUrl?: string;
  filename?: string;
}) {
  const { filename, isImage } = getFileInfo(url, overrideFilename);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const lightboxImages = useMemo<LightboxImageItem[]>(
    () => (url ? [{ url, downloadUrl: downloadUrl || url, filename, alt: filename }] : []),
    [downloadUrl, filename, url]
  );

  if (isImage) {
    return (
      <div className="mt-4 flex justify-center w-full max-w-2xl mx-auto">
        <ImagePreviewFrame
          url={url}
          alt={filename}
          downloadUrl={downloadUrl || url}
          className="w-full rounded-xl border border-border shadow-card"
          onOpen={() => setLightboxOpen(true)}
        />
        <ImageLightbox
          images={lightboxImages}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 inline-block w-full sm:w-auto max-w-full">
      <a
        href={downloadUrl || url}
        download={filename}
        onClick={async (e) => {
          e.preventDefault();
          if (downloading) return;
          setDownloading(true);
          try {
            await triggerFileDownload(downloadUrl || url, filename);
          } finally {
            setDownloading(false);
          }
        }}
        aria-busy={downloading}
        aria-label={`Download ${filename}`}
        className={cn(
          "inline-flex items-center gap-4 px-5 py-3.5 min-h-[44px] rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors shadow-card w-full group text-left",
          downloading && "pointer-events-none opacity-75"
        )}
      >
        <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
          <FileIcon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <span className="text-sm font-semibold text-foreground truncate block">{filename}</span>
          <span className="text-xs text-muted-foreground mt-0.5 font-medium">
            {downloading ? "Downloading..." : "Click to download"}
          </span>
        </div>
        <div className="pl-2 border-l border-border flex items-center justify-center shrink-0">
          {downloading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" aria-hidden="true" />
          ) : (
            <Download
              className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors ml-2"
              aria-hidden="true"
            />
          )}
        </div>
      </a>
    </div>
  );
}
