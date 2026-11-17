"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  ExternalLink,
  ImageIcon,
  ImageOff,
  Loader2,
  RefreshCw,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, triggerFileDownload } from "@/lib/utils";

export interface LightboxImageItem {
  id?: string;
  url: string;
  downloadUrl?: string;
  filename?: string;
  alt?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function getSafeFilename(item?: LightboxImageItem): string {
  if (item?.filename?.trim()) return item.filename.trim();
  if (!item?.url) return "image";
  try {
    const seg = new URL(item.url, "https://placeholder.local").pathname.split("/").pop() || "image";
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  } catch {
    return "image";
  }
}

function useImageLoader(url: string) {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<{
    src: string;
    status: "loaded" | "error";
    width?: number;
    height?: number;
  } | null>(null);

  const activeSrc =
    !url || retryCount === 0 ? url : `${url}${url.includes("?") ? "&" : "?"}_retry=${retryCount}`;
  const isLoaded = Boolean(activeSrc && state?.src === activeSrc && state.status === "loaded");
  const hasError = Boolean(!url || (state?.src === activeSrc && state.status === "error"));

  const onImgRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth > 0 && activeSrc && state?.src !== activeSrc) {
        setState({ src: activeSrc, status: "loaded", width: img.naturalWidth, height: img.naturalHeight });
      }
    },
    [activeSrc, state?.src]
  );

  return {
    activeSrc,
    isLoaded,
    hasError,
    isLoading: Boolean(url && !isLoaded && !hasError),
    dimensions: isLoaded && state?.width && state?.height ? { width: state.width, height: state.height } : null,
    onImgRef,
    retry: useCallback(() => setRetryCount((c) => c + 1), []),
    resetRetry: useCallback(() => setRetryCount(0), []),
    onLoad: useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) =>
        setState({ src: activeSrc, status: "loaded", width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight }),
      [activeSrc]
    ),
    onError: useCallback(() => setState({ src: activeSrc, status: "error" }), [activeSrc]),
  };
}

function DownloadActionLink({
  url,
  filename,
  variant = "secondary",
  size = "sm",
  hideLabelOnMobile = false,
  className,
}: {
  url: string;
  filename: string;
  variant?: "secondary" | "outline";
  size?: "sm" | "xs";
  hideLabelOnMobile?: boolean;
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    try {
      await triggerFileDownload(url, filename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <a
      href={url}
      download={filename}
      onClick={handleClick}
      aria-busy={downloading}
      aria-label={`Download ${filename}`}
      title={`Download ${filename}`}
      className={cn(
        buttonVariants({ variant, size }),
        "gap-1.5 font-medium",
        downloading && "pointer-events-none opacity-70",
        className
      )}
    >
      {downloading ? (
        <Loader2 className={cn("animate-spin", size === "xs" ? "size-3.5" : "size-4 sm:size-3.5")} aria-hidden="true" />
      ) : (
        <Download className={size === "xs" ? "size-3.5" : "size-4 sm:size-3.5"} aria-hidden="true" />
      )}
      <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>
        {downloading ? "Saving..." : "Download"}
      </span>
    </a>
  );
}

export function MediaDialogHeader({
  icon,
  title,
  badge,
  extraActions,
  openUrl,
  downloadUrl,
  downloadFilename,
  onClose,
  closeLabel = "Close preview",
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  extraActions?: React.ReactNode;
  openUrl?: string;
  downloadUrl?: string;
  downloadFilename?: string;
  onClose: () => void;
  closeLabel?: string;
}) {
  return (
    <DialogHeader className="flex flex-row items-center justify-between gap-3 px-3 sm:px-5 py-2.5 border-b border-border bg-muted/40 shrink-0 space-y-0">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="hidden sm:flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
        <DialogTitle className="font-heading font-semibold text-sm text-foreground truncate">
          {title}
        </DialogTitle>
        {badge}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {extraActions}
        {openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex gap-1.5 font-medium min-h-[36px]")}
            aria-label={`Open ${title} in new browser tab`}
            title="Open in new tab"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span>New Tab</span>
          </a>
        )}
        {downloadUrl && (
          <DownloadActionLink
            url={downloadUrl}
            filename={downloadFilename || title}
            hideLabelOnMobile
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0"
          />
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label={closeLabel}
          title="Close (Esc)"
          className="size-11 sm:size-9 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </DialogHeader>
  );
}

function ImageErrorFallback({
  label,
  description,
  url,
  downloadUrl,
  downloadName,
  onRetry,
  compact = false,
}: {
  label: string;
  description?: string;
  url?: string;
  downloadUrl?: string;
  downloadName?: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  const size = compact ? "xs" : "sm";
  const h = compact ? "min-h-[36px]" : "min-h-[44px] sm:min-h-[36px]";
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 text-center p-4 max-w-md z-10">
      <div className={cn("flex items-center justify-center text-muted-foreground", !compact && "size-14 rounded-2xl bg-muted border border-border")}>
        <ImageOff className={compact ? "size-8 opacity-60" : "size-7"} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className={compact ? "text-xs font-medium text-muted-foreground truncate max-w-xs" : "font-heading font-semibold text-base text-foreground"}>
          {label}
        </p>
        {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {url && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" size={size} variant="secondary" onClick={onRetry} className={cn("gap-1.5", h)}>
            <RefreshCw className="size-3.5" aria-hidden="true" />
            <span>{compact ? "Retry" : "Try Again"}</span>
          </Button>
          {downloadUrl && (
            <DownloadActionLink
              url={downloadUrl}
              filename={downloadName || label}
              variant="outline"
              size={size}
              className={h}
            />
          )}
          <a href={url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: compact && downloadUrl ? "ghost" : "outline", size }), "gap-1.5", h)}>
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span>{compact ? "Open" : "Open Directly"}</span>
          </a>
        </div>
      )}
    </div>
  );
}

export function ImagePreviewFrame({
  url,
  alt,
  downloadUrl,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 768px",
  className,
  onOpen,
}: {
  url: string;
  alt: string;
  downloadUrl?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  onOpen: () => void;
}) {
  const {
    activeSrc,
    isLoaded,
    hasError,
    isLoading,
    onImgRef,
    retry,
    onLoad,
    onError,
  } = useImageLoader(url);

  return (
    <div className={cn("relative aspect-video flex items-center justify-center bg-muted/30 overflow-hidden", className)}>
      {isLoading && <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-none" />}
      {hasError ? (
        <ImageErrorFallback compact label={`Failed to load ${alt}`} url={url} downloadUrl={downloadUrl} downloadName={alt} onRetry={retry} />
      ) : (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${alt} in full-screen viewer`}
          className="relative w-full h-full flex items-center justify-center group cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg overflow-hidden"
        >
          <Image
            key={activeSrc}
            ref={onImgRef}
            src={activeSrc}
            alt={alt}
            fill
            priority={priority}
            unoptimized
            sizes={sizes}
            className={cn("object-contain rounded-lg transition-opacity duration-200", isLoaded ? "opacity-100" : "opacity-0")}
            onLoad={onLoad}
            onError={onError}
          />
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-popover/90 text-foreground border border-border backdrop-blur-sm px-3 py-2 rounded-full shadow-md flex items-center gap-1.5 text-xs font-medium">
              <Expand className="size-4" aria-hidden="true" />
              <span>View full size</span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  onIndexChange,
}: {
  images: LightboxImageItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange?: (index: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-[96vw] sm:max-w-[96vw] h-[92dvh] max-h-[92dvh] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-modal flex flex-col"
      >
        {open && images.length > 0 ? (
          <ImageLightboxInner images={images} initialIndex={initialIndex} onClose={() => onOpenChange(false)} onIndexChange={onIndexChange} />
        ) : (
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>No image selected</DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImageLightboxInner({
  images,
  initialIndex,
  onClose,
  onIndexChange,
}: {
  images: LightboxImageItem[];
  initialIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(() => clamp(initialIndex, 0, Math.max(0, images.length - 1)));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const safeIndex = clamp(activeIndex, 0, Math.max(0, images.length - 1));
  const current = images[safeIndex];
  const hasMultiple = images.length > 1;
  const filename = getSafeFilename(current);
  const altText = current?.alt || filename || "Image preview";
  const {
    activeSrc,
    isLoaded,
    hasError,
    isLoading,
    dimensions,
    onImgRef,
    retry,
    resetRetry,
    onLoad,
    onError,
  } = useImageLoader(current?.url || "");

  const clampPan = useCallback((nx: number, ny: number, z: number) => {
    if (z <= 1) return { x: 0, y: 0 };
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: nx, y: ny };
    const maxX = Math.max(0, ((z - 1) * rect.width) / 2);
    const maxY = Math.max(0, ((z - 1) * rect.height) / 2);
    return { x: clamp(nx, -maxX, maxX), y: clamp(ny, -maxY, maxY) };
  }, []);

  const endDrag = useCallback((pointerId?: number, target?: HTMLElement | null) => {
    if (pointerId !== undefined && pointerIdRef.current !== pointerId) return;
    if (pointerIdRef.current !== null && target) {
      try {
        if (target.hasPointerCapture(pointerIdRef.current)) target.releasePointerCapture(pointerIdRef.current);
      } catch {
        // Already released
      }
    }
    pointerIdRef.current = null;
    dragOriginRef.current = null;
    setIsDragging(false);
  }, []);

  const resetTransform = useCallback(() => {
    endDrag();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [endDrag]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (images.length <= 1) return;
      const wrapped = ((nextIndex % images.length) + images.length) % images.length;
      resetTransform();
      resetRetry();
      setActiveIndex(wrapped);
      onIndexChange?.(wrapped);
    },
    [images.length, onIndexChange, resetRetry, resetTransform]
  );

  const applyZoom = useCallback(
    (delta: number) => {
      setZoom((prev) => {
        const next = clamp(Number((prev + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM);
        setPan((p) => clampPan(p.x, p.y, next));
        return next;
      });
    },
    [clampPan]
  );

  useEffect(() => {
    const onBlur = () => endDrag();
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [endDrag]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowLeft" && hasMultiple) { e.preventDefault(); goToIndex(safeIndex - 1); }
      else if (e.key === "ArrowRight" && hasMultiple) { e.preventDefault(); goToIndex(safeIndex + 1); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); applyZoom(ZOOM_STEP); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); applyZoom(-ZOOM_STEP); }
      else if (e.key === "0") { e.preventDefault(); resetTransform(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyZoom, goToIndex, hasMultiple, resetTransform, safeIndex]);

  return (
    <>
      <DialogDescription className="sr-only">Full-size preview of {altText}</DialogDescription>

      <MediaDialogHeader
        icon={<ImageIcon className="size-4" aria-hidden="true" />}
        title={filename}
        badge={hasMultiple ? <span className="font-mono tabular-nums text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border shrink-0">{safeIndex + 1} / {images.length}</span> : undefined}
        openUrl={current?.url}
        downloadUrl={current?.downloadUrl || current?.url || ""}
        downloadFilename={filename}
        onClose={onClose}
        closeLabel="Close image preview"
      />

      <div
        ref={stageRef}
        onPointerDown={(e) => {
          if (zoom <= 1 || !isLoaded || e.button !== 0 || pointerIdRef.current !== null) return;
          pointerIdRef.current = e.pointerId;
          dragOriginRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
          setIsDragging(true);
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
        }}
        onPointerMove={(e) => {
          if (pointerIdRef.current !== e.pointerId || !dragOriginRef.current) return;
          setPan(clampPan(dragOriginRef.current.panX + e.clientX - dragOriginRef.current.x, dragOriginRef.current.panY + e.clientY - dragOriginRef.current.y, zoom));
        }}
        onPointerUp={(e) => endDrag(e.pointerId, e.currentTarget)}
        onPointerCancel={(e) => endDrag(e.pointerId, e.currentTarget)}
        onLostPointerCapture={(e) => endDrag(e.pointerId, e.currentTarget)}
        onDoubleClick={() => {
          if (!isLoaded) return;
          if (zoom > 1) resetTransform();
          else { setZoom(2); setPan({ x: 0, y: 0 }); }
        }}
        style={{ touchAction: zoom > 1 ? "none" : "pan-y" }}
        className={cn(
          "relative flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center bg-muted/25 select-none",
          zoom > 1 && (isDragging ? "cursor-grabbing" : "cursor-grab"),
          zoom === 1 && isLoaded && "cursor-zoom-in"
        )}
      >
        {isLoading && (
          <div className="absolute inset-4 sm:inset-8 flex items-center justify-center pointer-events-none z-10">
            <Skeleton className="w-full h-full max-w-3xl rounded-xl" />
            <span className="sr-only">Loading image preview</span>
          </div>
        )}

        {hasError ? (
          <ImageErrorFallback
            label="Could not load image"
            description="The image link may have expired or your network connection was interrupted."
            url={current?.url}
            onRetry={retry}
          />
        ) : (
          <div
            className={cn("relative w-full h-full p-2 sm:p-4", !isDragging && "transition-transform duration-150 ease-out")}
            style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`, transformOrigin: "center center" }}
          >
            <div className="relative w-full h-full">
              <Image
                key={activeSrc}
                ref={onImgRef}
                src={activeSrc}
                alt={altText}
                fill
                unoptimized
                sizes="96vw"
                draggable={false}
                className={cn("object-contain transition-opacity duration-200", isLoaded ? "opacity-100" : "opacity-0")}
                onLoad={onLoad}
                onError={onError}
              />
            </div>
          </div>
        )}

        {hasMultiple &&
          (
            [
              { delta: -1, label: "Previous image", title: "Previous image (Left Arrow)", side: "left-2 sm:left-3", Icon: ChevronLeft },
              { delta: 1, label: "Next image", title: "Next image (Right Arrow)", side: "right-2 sm:right-3", Icon: ChevronRight },
            ] as const
          ).map(({ delta, label, title, side, Icon }) => (
            <Button
              key={label}
              type="button"
              variant="secondary"
              size="icon"
              onClick={(e) => { e.stopPropagation(); goToIndex(safeIndex + delta); }}
              aria-label={label}
              title={title}
              className={cn("absolute top-1/2 -translate-y-1/2 rounded-full shadow-md bg-popover/90 hover:bg-popover border border-border z-20", side)}
            >
              <Icon className="size-5" aria-hidden="true" />
            </Button>
          ))}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2 border-t border-border bg-muted/40 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
          {dimensions ? (
            <span className="font-mono tabular-nums">{dimensions.width} × {dimensions.height}</span>
          ) : (
            <span className="hidden sm:inline">Image viewer</span>
          )}
          <span className="hidden md:inline text-muted-foreground/75">
            · {zoom > 1 ? "Drag to pan · Double-click to reset" : "Double-click to zoom"}
          </span>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 ml-auto" role="group" aria-label="Zoom controls">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => applyZoom(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM || hasError || !isLoaded} aria-label="Zoom out" title="Zoom out (-)" className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]">
            <ZoomOut className="size-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={resetTransform} disabled={(zoom === 1 && pan.x === 0 && pan.y === 0) || hasError} aria-label={`Reset zoom, currently ${Math.round(zoom * 100)}%`} title="Reset zoom (0)" className="font-mono tabular-nums min-w-[3.25rem] min-h-[44px] sm:min-h-[32px] px-2 text-foreground">
            {Math.round(zoom * 100)}%
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => applyZoom(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM || hasError || !isLoaded} aria-label="Zoom in" title="Zoom in (+)" className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]">
            <ZoomIn className="size-4" aria-hidden="true" />
          </Button>
          {zoom > 1 && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={resetTransform} aria-label="Reset view" title="Reset view (0)" className="hidden sm:inline-flex min-h-[32px] min-w-[32px]">
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
