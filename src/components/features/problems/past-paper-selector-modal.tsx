"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { Resource } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PastPapersFolderView } from "@/components/features/resources/past-papers-folder-view";
import {
  DocumentViewerModal,
  ViewingDocument,
} from "@/components/features/resources/document-viewer-modal";
import { Search, X, Loader2, BookOpen } from "lucide-react";

interface PastPaperSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelId: string;
  subjectId: string;
  levelName?: string;
  subjectName?: string;
  selectedPaperId?: string;
  onSelectPaper: (paper: Resource) => void;
}

export function PastPaperSelectorModal({
  isOpen,
  onClose,
  levelId,
  subjectId,
  levelName,
  subjectName,
  selectedPaperId,
  onSelectPaper,
}: PastPaperSelectorModalProps) {
  const { getToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingDoc, setViewingDoc] = useState<ViewingDocument | null>(null);

  // Fetch past papers filtered by level and subject
  const {
    data: resources = [],
    isLoading,
    isError,
  } = useQuery<Resource[]>({
    queryKey: ["pastPaperSelectorResources", levelId, subjectId],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      params.append("resource_type", "PAST_PAPER");
      if (levelId) params.append("level", levelId);
      if (subjectId) params.append("subject", subjectId);

      const res = await apiFetch<any>(`/resources/files/?${params.toString()}`, token as string);
      return Array.isArray(res) ? res : res?.data || res?.results || [];
    },
    enabled: isOpen && !!levelId && !!subjectId,
  });

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setViewingDoc(null);
    }
  }, [isOpen]);

  // Filter papers based on search query
  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const q = searchQuery.toLowerCase().trim();
    return resources.filter((r) => {
      const name = (r.file_name || r.title || "").toLowerCase();
      const session = (r.session || "").toLowerCase();
      const type = (r.paper_type || "").toLowerCase();
      const year = r.year?.toString() || "";
      return name.includes(q) || session.includes(q) || type.includes(q) || year.includes(q);
    });
  }, [resources, searchQuery]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-3 border-b border-line bg-surface/80">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
                  <BookOpen className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <DialogTitle className="text-base font-bold font-display text-ink truncate">
                    Select Curated Past Paper
                  </DialogTitle>
                  <DialogDescription className="text-xs text-ink-muted flex items-center gap-1.5 truncate mt-0.5">
                    <span>Targeting:</span>
                    {levelName && (
                      <Badge variant="outline" className="text-[11px] font-semibold py-0 px-1.5 h-5">
                        {levelName}
                      </Badge>
                    )}
                    {subjectName && (
                      <Badge variant="secondary" className="text-[11px] font-semibold py-0 px-1.5 h-5">
                        {subjectName}
                      </Badge>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Search papers by name, code, or session (e.g. 9709, May / June, QP)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-line bg-card pl-9 pr-9 py-2 text-xs text-ink placeholder:text-ink-muted/70 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </DialogHeader>

          {/* Body: Shared Past Papers Folder View */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-muted">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="text-xs font-medium">Loading past papers for {subjectName || "subject"}...</p>
              </div>
            ) : isError ? (
              <EmptyState
                title="Failed to load past papers"
                description="An error occurred while fetching the past paper library. Please try again."
              />
            ) : filteredPapers.length === 0 ? (
              <EmptyState
                title={searchQuery ? "No matching papers found" : "No past papers available"}
                description={
                  searchQuery
                    ? `No papers match "${searchQuery}". Try a different keyword or clear the search.`
                    : `No past papers have been uploaded yet for ${levelName || "this level"} ${subjectName || "this subject"}.`
                }
              />
            ) : (
              <PastPapersFolderView
                papers={filteredPapers}
                variant="select"
                selectedPaperId={selectedPaperId}
                onSelectPaper={(paper) => {
                  onSelectPaper(paper);
                  onClose();
                }}
                onView={setViewingDoc}
                emptyMessage={
                  searchQuery
                    ? "No papers match your search."
                    : "No past papers available for this selection."
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shared Document Preview Modal */}
      <DocumentViewerModal
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onSelect={(paper) => {
          onSelectPaper(paper);
          setViewingDoc(null);
          onClose();
        }}
      />
    </>
  );
}
