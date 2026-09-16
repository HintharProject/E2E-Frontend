"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import { useTrainResource, usePairMs, useTrainTimer } from "@/hooks/use-train";
import { Resource, TrainTreePaper } from "@/types";
import { TrainTopBar } from "@/components/features/train/train-top-bar";
import { CurriculumTreeSidebar } from "@/components/features/train/curriculum-tree-sidebar";
import { DualPdfViewer } from "@/components/features/train/dual-pdf-viewer";
import { SelfMarkingDrawer } from "@/components/features/train/self-marking-drawer";
import { AskInSolveModal } from "@/components/features/train/ask-in-solve-modal";
import { SolveAPaperModal } from "@/components/features/train/solve-a-paper-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface TrainWorkspacePageProps {
  params: Promise<{ resourceId: string }>;
}

export default function TrainWorkspacePage({ params }: TrainWorkspacePageProps) {
  const { resourceId } = use(params);

  // Fetch target Question Paper
  const {
    data: paper,
    isLoading: isPaperLoading,
    isError: isPaperError,
    error: paperError,
  } = useTrainResource(resourceId);

  // Fetch sibling Mark Scheme
  const { data: pairData } = usePairMs(resourceId);

  // Active paper IDs for Left and Right panes
  const [leftPaperId, setLeftPaperId] = useState<string | null>(resourceId);
  const [rightPaperOverride, setRightPaperOverride] = useState<string | null | undefined>(undefined);

  // In-memory cache of loaded resources from user sidebar toggles
  const [loadedResources, setLoadedResources] = useState<Record<string, Resource>>({});

  // Compute effective right paper ID:
  // If user explicitly toggled right (override is string or null), use override.
  // Otherwise, if default preference is DUAL and sibling exists, use sibling ID.
  const rightPaperId = useMemo(() => {
    if (rightPaperOverride !== undefined) {
      return rightPaperOverride;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("train_default_view_mode");
      const sibling = pairData?.sibling;
      if (saved === "DUAL" && sibling) {
        return sibling.id;
      }
    }
    return null;
  }, [rightPaperOverride, pairData]);

  // Dynamic fetch for Left paper if different from initial paper/sibling and not fully loaded in cache
  const shouldFetchLeft = Boolean(
    leftPaperId &&
    leftPaperId !== resourceId &&
    leftPaperId !== pairData?.sibling?.id &&
    (!loadedResources[leftPaperId] || !loadedResources[leftPaperId].year)
  );
  const { data: fetchedLeftPaper, isLoading: isFetchedLeftLoading } = useTrainResource(
    shouldFetchLeft ? leftPaperId : null
  );

  // Dynamic fetch for Right paper if different from initial paper/sibling and not fully loaded in cache
  const shouldFetchRight = Boolean(
    rightPaperId &&
    rightPaperId !== resourceId &&
    rightPaperId !== pairData?.sibling?.id &&
    (!loadedResources[rightPaperId] || !loadedResources[rightPaperId].year)
  );
  const { data: fetchedRightPaper, isLoading: isFetchedRightLoading } = useTrainResource(
    shouldFetchRight ? rightPaperId : null
  );

  // Store newly fetched papers into in-memory cache
  useEffect(() => {
    if (paper) {
      setLoadedResources((prev) => ({ ...prev, [paper.id]: paper }));
    }
  }, [paper]);

  useEffect(() => {
    const sibling = pairData?.sibling;
    if (sibling) {
      setLoadedResources((prev) => ({
        ...prev,
        [sibling.id]: {
          id: sibling.id,
          file_name: sibling.file_name,
          file_url: sibling.file_url,
          download_url: sibling.download_url || sibling.file_url,
          paper_type: sibling.paper_type,
          paper_code: sibling.paper_code ?? paper?.paper_code,
          year: sibling.year ?? paper?.year ?? null,
          session: sibling.session ?? paper?.session ?? null,
          level: paper?.level || "",
          subject: paper?.subject || "",
          level_details: paper?.level_details,
          subject_details: paper?.subject_details,
          resource_type: "PAST_PAPER",
        } as Resource,
      }));
    }
  }, [pairData, paper]);

  useEffect(() => {
    if (fetchedLeftPaper) {
      setLoadedResources((prev) => ({
        ...prev,
        [fetchedLeftPaper.id]: {
          ...prev[fetchedLeftPaper.id],
          ...fetchedLeftPaper,
        },
      }));
    }
  }, [fetchedLeftPaper]);

  useEffect(() => {
    if (fetchedRightPaper) {
      setLoadedResources((prev) => ({
        ...prev,
        [fetchedRightPaper.id]: {
          ...prev[fetchedRightPaper.id],
          ...fetchedRightPaper,
        },
      }));
    }
  }, [fetchedRightPaper]);

  // Active Left & Right resources derived cleanly
  const leftPaper = useMemo(() => {
    if (!leftPaperId) return null;
    if (paper && leftPaperId === paper.id) return paper;
    if (fetchedLeftPaper && fetchedLeftPaper.id === leftPaperId) {
      return fetchedLeftPaper;
    }
    if (loadedResources[leftPaperId]) {
      return loadedResources[leftPaperId];
    }
    const sibling = pairData?.sibling;
    if (sibling && leftPaperId === sibling.id) {
      return {
        ...paper,
        ...sibling,
        paper_type: sibling.paper_type,
      } as Resource;
    }
    return null;
  }, [leftPaperId, paper, pairData, fetchedLeftPaper, loadedResources]);

  const rightPaper = useMemo(() => {
    if (!rightPaperId) return null;
    if (paper && rightPaperId === paper.id) return paper;
    if (fetchedRightPaper && fetchedRightPaper.id === rightPaperId) {
      return fetchedRightPaper;
    }
    if (loadedResources[rightPaperId]) {
      return loadedResources[rightPaperId];
    }
    const sibling = pairData?.sibling;
    if (sibling && rightPaperId === sibling.id) {
      return {
        ...paper,
        ...sibling,
        paper_type: sibling.paper_type,
      } as Resource;
    }
    return null;
  }, [rightPaperId, paper, pairData, fetchedRightPaper, loadedResources]);

  // Primary active paper:
  // 1. If Left is QP, prefer Left.
  // 2. If Right is QP and Left is not, prefer Right.
  // 3. Otherwise prefer leftPaper, then rightPaper, then route paper.
  const primaryPaper = useMemo(() => {
    if (leftPaper && leftPaper.paper_type === "QP") return leftPaper;
    if (rightPaper && rightPaper.paper_type === "QP") return rightPaper;
    return (leftPaper || rightPaper || paper) as Resource;
  }, [leftPaper, rightPaper, paper]);

  const isLoadingLeft = Boolean(leftPaperId && !leftPaper && (isFetchedLeftLoading || isPaperLoading));
  const isLoadingRight = Boolean(rightPaperId && !rightPaper && isFetchedRightLoading);

  // Sync preference whenever both panes are active
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (leftPaperId && rightPaperId) {
          localStorage.setItem("train_default_view_mode", "DUAL");
        } else {
          localStorage.setItem("train_default_view_mode", "SINGLE");
        }
      } catch {
        // Ignore
      }
    }
  }, [leftPaperId, rightPaperId]);

  // Handlers for Left and Right toggle buttons on each paper in the sidebar
  const handleToggleLeft = (treePaper: TrainTreePaper) => {
    if (leftPaperId === treePaper.id) {
      // Toggle off: disable Left, closing it in view
      setLeftPaperId(null);
    } else {
      // Activate Left
      setLeftPaperId(treePaper.id);
      // There can't be two left or two right papers, and a paper shouldn't be both left and right
      if (rightPaperId === treePaper.id) {
        setRightPaperOverride(null);
      }
      // If treePaper already has a valid pre-signed URL (contains AWS query signature), cache optimistically
      if (treePaper.file_url && treePaper.file_url.includes("X-Amz-Signature")) {
        setLoadedResources((prev) => ({
          ...prev,
          [treePaper.id]: {
            id: treePaper.id,
            file_name: treePaper.file_name,
            file_url: treePaper.file_url!,
            download_url: treePaper.download_url || treePaper.file_url,
            paper_type: (treePaper.paper_type as "QP" | "MS") || undefined,
            paper_code: treePaper.paper_code,
            year: treePaper.year ?? undefined,
            session: treePaper.session ?? undefined,
            level: paper?.level || "",
            subject: paper?.subject || "",
            level_details: paper?.level_details,
            subject_details: paper?.subject_details,
            resource_type: "PAST_PAPER",
          } as Resource,
        }));
      }
    }
  };

  const handleToggleRight = (treePaper: TrainTreePaper) => {
    if (rightPaperId === treePaper.id) {
      // Toggle off: disable Right, closing it in view
      setRightPaperOverride(null);
    } else {
      // Activate Right
      setRightPaperOverride(treePaper.id);
      // There can't be two left or two right papers, and a paper shouldn't be both left and right
      if (leftPaperId === treePaper.id) {
        setLeftPaperId(null);
      }
      // If treePaper already has a valid pre-signed URL (contains AWS query signature), cache optimistically
      if (treePaper.file_url && treePaper.file_url.includes("X-Amz-Signature")) {
        setLoadedResources((prev) => ({
          ...prev,
          [treePaper.id]: {
            id: treePaper.id,
            file_name: treePaper.file_name,
            file_url: treePaper.file_url!,
            download_url: treePaper.download_url || treePaper.file_url,
            paper_type: (treePaper.paper_type as "QP" | "MS") || undefined,
            paper_code: treePaper.paper_code,
            year: treePaper.year ?? undefined,
            session: treePaper.session ?? undefined,
            level: paper?.level || "",
            subject: paper?.subject || "",
            level_details: paper?.level_details,
            subject_details: paper?.subject_details,
            resource_type: "PAST_PAPER",
          } as Resource,
        }));
      }
    }
  };

  const handleCloseLeft = () => setLeftPaperId(null);
  const handleCloseRight = () => setRightPaperOverride(null);

  // Timer engine
  const timer = useTrainTimer(resourceId);

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Interactive drawers & modals state
  const [isSelfMarkOpen, setIsSelfMarkOpen] = useState(false);
  const [isAskInSolveOpen, setIsAskInSolveOpen] = useState(false);
  const [isSolveAPaperOpen, setIsSolveAPaperOpen] = useState(false);

  // Loading State Skeleton
  if (isPaperLoading) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        {/* Top bar skeleton */}
        <div className="h-14 border-b border-line bg-surface/50 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-5 w-40 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>

        {/* Content row skeleton */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 border-r border-line bg-card/30 p-3 space-y-3 hidden lg:block">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <div className="flex-1 bg-muted/20 flex items-center justify-center p-8">
            <Skeleton className="h-full w-full max-w-4xl rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error State Fallback
  if (isPaperError || !paper) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen p-6 bg-background text-center space-y-4 select-none">
        <div className="size-14 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-xl font-bold text-ink">Exam Paper Not Found</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            {paperError?.message ||
              "The requested exam paper could not be found or has been removed from the platform archives."}
          </p>
        </div>
        <Link
          href="/resources"
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "gap-1.5 font-semibold bg-primary text-primary-foreground",
          })}
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Resources Store</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* 1. Sticky Action Top Bar */}
      <TrainTopBar
        paper={primaryPaper}
        leftPaper={leftPaper}
        rightPaper={rightPaper}
        onCloseLeft={leftPaper ? handleCloseLeft : undefined}
        onCloseRight={rightPaper ? handleCloseRight : undefined}
        timer={timer}
        onOpenSelfMark={() => setIsSelfMarkOpen(true)}
        onOpenAskInSolve={() => setIsAskInSolveOpen(true)}
        onOpenSolveAPaper={() => setIsSolveAPaperOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Main Practice Canvas Row */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Zero-Reload Curriculum Hierarchy Sidebar */}
        <CurriculumTreeSidebar
          activePaperId={resourceId}
          leftPaperId={leftPaperId}
          rightPaperId={rightPaperId}
          onToggleLeft={handleToggleLeft}
          onToggleRight={handleToggleRight}
          subjectId={paper.subject}
          levelId={paper.level}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Dual / Single View PDF Viewer */}
        <main className="flex-1 h-full overflow-hidden flex flex-col">
          <DualPdfViewer
            leftResource={leftPaper}
            rightResource={rightPaper}
            isLoadingLeft={isLoadingLeft}
            isLoadingRight={isLoadingRight}
            onCloseLeft={leftPaper ? handleCloseLeft : undefined}
            onCloseRight={rightPaper ? handleCloseRight : undefined}
          />
        </main>
      </div>

      {/* 3. Interactive Drawers & Modals */}
      <SelfMarkingDrawer
        isOpen={isSelfMarkOpen}
        onClose={() => setIsSelfMarkOpen(false)}
        paper={primaryPaper}
        timer={timer}
      />

      <AskInSolveModal
        isOpen={isAskInSolveOpen}
        onClose={() => setIsAskInSolveOpen(false)}
        activePaper={primaryPaper}
        leftPaper={leftPaper}
        rightPaper={rightPaper}
      />

      <SolveAPaperModal
        isOpen={isSolveAPaperOpen}
        onClose={() => setIsSolveAPaperOpen(false)}
        paper={primaryPaper}
      />
    </div>
  );
}
