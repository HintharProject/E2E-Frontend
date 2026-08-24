"use client";

import { useState } from "react";
import { LessonAttachment } from "@/types";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video, Download, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

function parseYouTubeUrl(url: string) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const listId = urlObj.searchParams.get('list');
      if (listId) {
        return { type: 'playlist', url };
      }
      const videoId = urlObj.hostname.includes('youtu.be') 
        ? urlObj.pathname.slice(1) 
        : urlObj.searchParams.get('v');
      if (videoId) {
        return { type: 'video', videoId };
      }
    }
  } catch (e) {}
  return { type: 'other', url };
}

interface LessonMediaViewerProps {
  imageAttachments: (LessonAttachment | any)[];
  youtubeUrl: string | null | undefined;
}

export function LessonMediaViewer({ imageAttachments, youtubeUrl }: LessonMediaViewerProps) {
  const [activeTab, setActiveTab] = useState<"images" | "video">(
    imageAttachments.length > 0 ? "images" : "video"
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [videoLoaded, setVideoLoaded] = useState(false);

  if (imageAttachments.length === 0 && !youtubeUrl) return null;

  const showTabs = imageAttachments.length > 0 && !!youtubeUrl;

  const getImageUrl = (att: any) => att?.attachment_url || att?.file_url || "";
  const getDownloadUrl = (att: any) => att?.download_url || att?.attachment_url || att?.file_url || "";

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageAttachments.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageAttachments.length) % imageAttachments.length);
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {showTabs && (
        <div className="flex items-center gap-2 border-b border-line pb-2">
          <button
            onClick={() => setActiveTab("images")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors border-b-2",
              activeTab === "images" ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            Images ({imageAttachments.length})
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors border-b-2",
              activeTab === "video" ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        </div>
      )}

      {/* Content */}
      <div className="w-full bg-surface border border-line rounded-xl overflow-hidden relative">
        {activeTab === "images" && imageAttachments.length > 0 && (
          <div className="relative aspect-video flex items-center justify-center bg-black/5 overflow-hidden">
            {/* Render all images stacked for instant switching & parallel download */}
            {imageAttachments.map((img, idx) => {
              const url = getImageUrl(img);
              const isCurrent = idx === currentImageIndex;
              const isLoaded = imageLoaded[idx];
              const hasError = imageErrors[idx];

              return (
                <div
                  key={img.id || idx}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center p-2 transition-opacity duration-300",
                    isCurrent ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                  )}
                >
                  {!isLoaded && !hasError && isCurrent && (
                    <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-none" />
                  )}

                  {hasError ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-ink-muted">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-xs">Failed to load image</span>
                    </div>
                  ) : (
                    <Dialog>
                      <DialogTrigger className="w-full h-full flex items-center justify-center group outline-none">
                        <img
                          src={url}
                          alt={img.file_name || "Attachment"}
                          className={cn(
                            "max-w-full max-h-full object-contain mx-auto shadow-sm rounded-lg transition-opacity duration-200",
                            !isLoaded ? "opacity-0" : "opacity-100"
                          )}
                          loading={idx === 0 ? "eager" : "lazy"}
                          fetchPriority={idx === 0 ? "high" : "auto"}
                          onLoad={() => setImageLoaded((prev) => ({ ...prev, [idx]: true }))}
                          onError={() => setImageErrors((prev) => ({ ...prev, [idx]: true }))}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg">
                            <Expand className="w-6 h-6" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl w-full h-[90vh] bg-transparent border-none shadow-none flex items-center justify-center p-0">
                        <DialogTitle className="sr-only">Image View</DialogTitle>
                        <div className="relative w-full h-full flex items-center justify-center group">
                          <img
                            src={url}
                            alt="Attachment full size"
                            className="max-h-[90vh] w-auto object-contain rounded-md shadow-2xl mx-auto"
                            loading="lazy"
                          />
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            <a
                              href={getDownloadUrl(img)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className={cn(buttonVariants({ size: "icon", variant: "secondary" }), "rounded-full shadow-lg h-10 w-10")}
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              );
            })}

            {/* Navigation Arrows */}
            {imageAttachments.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-surface/80 hover:bg-surface text-ink rounded-full shadow-sm backdrop-blur-sm transition-all border border-line z-20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-surface/80 hover:bg-surface text-ink rounded-full shadow-sm backdrop-blur-sm transition-all border border-line z-20"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-ink shadow-sm border border-line z-20">
                  {currentImageIndex + 1} / {imageAttachments.length}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "video" && youtubeUrl && (
          <div className="w-full">
            {(() => {
              const yt = parseYouTubeUrl(youtubeUrl);
              if (yt.type === 'video') {
                return (
                  <div className="aspect-video w-full bg-black relative">
                    {!videoLoaded && (
                      <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-none" />
                    )}
                    <iframe
                      src={`https://www.youtube.com/embed/${yt.videoId}`}
                      title="YouTube video player"
                      className={cn("w-full h-full border-0 relative z-10 transition-opacity duration-300", !videoLoaded ? "opacity-0" : "opacity-100")}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      onLoad={() => setVideoLoaded(true)}
                    ></iframe>
                  </div>
                );
              }
              if (yt.type === 'playlist') {
                return (
                  <div className="relative p-8 flex items-center justify-center group hover:bg-surface-raised transition-colors aspect-video flex-col gap-4 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FF0000]/10 text-[#FF0000] shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xl text-ink group-hover:text-[#FF0000] transition-colors">YouTube Playlist</h4>
                      <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto line-clamp-2">{youtubeUrl}</p>
                    </div>
                    <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 rounded-xl">
                      <span className="sr-only">Open YouTube Playlist</span>
                    </a>
                  </div>
                );
              }
              return (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-soft to-surface p-6 text-center">
                  <div>
                    <p className="font-display text-lg text-brand-dark">Embedded video</p>
                    <a href={youtubeUrl} className="mt-2 inline-block text-sm font-semibold text-ink underline break-all" target="_blank" rel="noreferrer">
                      {youtubeUrl}
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
