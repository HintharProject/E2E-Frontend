"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  ImageLightbox,
  ImagePreviewFrame,
  type LightboxImageItem,
} from "@/components/ui/image-lightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function parseYouTubeUrl(url: string) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      const listId = urlObj.searchParams.get("list");
      if (listId) return { type: "playlist" as const, listId, url };

      let videoId = urlObj.hostname.includes("youtu.be")
        ? urlObj.pathname.slice(1).split("/")[0]
        : urlObj.searchParams.get("v");

      if (!videoId && urlObj.pathname.startsWith("/shorts/")) {
        videoId = urlObj.pathname.split("/")[2] || null;
      }
      if (videoId) return { type: "video" as const, videoId, url };
    }
  } catch {
    // Fallback to direct external link
  }
  return { type: "other" as const, url };
}

interface MediaAttachmentLike {
  id?: string;
  attachment_url?: string | null;
  file_url?: string | null;
  download_url?: string | null;
  file_name?: string | null;
  attachment_name?: string | null;
  created_at?: string;
}

interface LessonMediaViewerProps {
  imageAttachments: MediaAttachmentLike[];
  youtubeUrl: string | null | undefined;
}

export function LessonMediaViewer({ imageAttachments, youtubeUrl }: LessonMediaViewerProps) {
  const [activeTab, setActiveTab] = useState<"images" | "video">(
    imageAttachments.length > 0 ? "images" : "video"
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const lightboxImages = useMemo<LightboxImageItem[]>(
    () =>
      imageAttachments
        .map((att, idx) => {
          const url = att?.attachment_url || att?.file_url || "";
          const name = att?.file_name || att?.attachment_name || "Attachment";
          return {
            id: att?.id || String(idx),
            url,
            downloadUrl: att?.download_url || url,
            filename: name,
            alt: name,
          };
        })
        .filter((item) => Boolean(item.url)),
    [imageAttachments]
  );

  if (imageAttachments.length === 0 && !youtubeUrl) return null;

  const showTabs = imageAttachments.length > 0 && Boolean(youtubeUrl);
  const safeIndex =
    lightboxImages.length > 0 ? Math.min(currentImageIndex, lightboxImages.length - 1) : 0;
  const current = lightboxImages[safeIndex];
  const yt = youtubeUrl ? parseYouTubeUrl(youtubeUrl) : null;

  const stepImage = (delta: number) => {
    if (lightboxImages.length <= 1) return;
    setCurrentImageIndex(
      (prev) => (prev + delta + lightboxImages.length) % lightboxImages.length
    );
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {showTabs && (
        <div className="flex items-center gap-2 border-b border-border pb-2" role="tablist">
          {(
            [
              { key: "images", label: `Images (${imageAttachments.length})`, Icon: ImageIcon },
              { key: "video", label: "Video", Icon: Video },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 min-h-[44px] sm:min-h-[38px] text-sm font-semibold transition-colors border-b-2 cursor-pointer",
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="w-full bg-card border border-border rounded-xl overflow-hidden relative shadow-card">
        {activeTab === "images" && lightboxImages.length > 0 && current && (
          <div className="relative">
            <ImagePreviewFrame
              url={current.url}
              alt={current.alt || "Attachment"}
              downloadUrl={current.downloadUrl}
              priority={safeIndex === 0}
              className="p-2 sm:p-3"
              onOpen={() => setLightboxOpen(true)}
            />

            {lightboxImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => stepImage(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-popover/90 hover:bg-popover text-foreground rounded-full shadow-sm backdrop-blur-sm transition-colors border border-border z-20 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => stepImage(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-popover/90 hover:bg-popover text-foreground rounded-full shadow-sm backdrop-blur-sm transition-colors border border-border z-20 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-popover/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono tabular-nums font-medium text-foreground shadow-sm border border-border z-20 pointer-events-none">
                  {safeIndex + 1} / {lightboxImages.length}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "video" && yt && (
          <div className="w-full">
            {yt.type === "video" || yt.type === "playlist" ? (
              <div className="flex flex-col gap-4">
                <div className="aspect-video w-full bg-black relative overflow-hidden">
                  {!videoLoaded && (
                    <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-none" />
                  )}
                  <iframe
                    src={
                      yt.type === "video"
                        ? `https://www.youtube.com/embed/${yt.videoId}?rel=0`
                        : `https://www.youtube.com/embed?listType=playlist&list=${yt.listId}&rel=0`
                    }
                    title={
                      yt.type === "video" ? "YouTube video player" : "YouTube playlist player"
                    }
                    className={cn(
                      "w-full h-full border-0 relative z-10 transition-opacity duration-300",
                      !videoLoaded ? "opacity-0" : "opacity-100"
                    )}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    onLoad={() => setVideoLoaded(true)}
                  />
                </div>

                {yt.type === "playlist" && (
                  <div className="flex items-center justify-between bg-card border-t border-border p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
                        <Video className="size-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-foreground">YouTube Playlist</h4>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          Watch the full playlist on YouTube
                        </p>
                      </div>
                    </div>
                    <a
                      href={yt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-2 shrink-0 min-h-[44px] sm:min-h-[36px]"
                      )}
                    >
                      <span>Open Playlist</span>
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted/40 p-6 text-center">
                <div>
                  <p className="font-heading font-semibold text-lg text-foreground">
                    Embedded video
                  </p>
                  <a
                    href={yt.url}
                    className="mt-2 inline-block text-sm font-semibold text-primary underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {yt.url}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={safeIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setCurrentImageIndex}
      />
    </div>
  );
}
