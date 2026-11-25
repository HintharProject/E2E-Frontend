"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { Resource } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { PastPapersFolderView } from "@/components/features/resources/past-papers-folder-view";
import {
  DocumentViewerModal,
  ViewingDocument,
} from "@/components/features/resources/document-viewer-modal";
import { Search, X, Loader2, BookOpen } from "lucide-react";

export interface PastPaperSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelId?: string;
  subjectId?: string;
  levelName?: string;
  subjectName?: string;
  selectedPaperId?: string;
  onSelectPaper: (paper: Resource) => void;
}

export function PastPaperSelectorModal({
  isOpen,
  onClose,
  levelId = "",
  subjectId = "",
  levelName,
  subjectName,
  selectedPaperId,
  onSelectPaper,
}: PastPaperSelectorModalProps) {
  const { getToken } = useAuth();
  const { data: levels = [] } = useLevels();
  const { data: subjects = [] } = useSubjects();

  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [filterLevelId, setFilterLevelId] = useState(levelId);
  const [filterSubjectId, setFilterSubjectId] = useState(subjectId);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingDoc, setViewingDoc] = useState<ViewingDocument | null>(null);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setFilterLevelId(levelId);
      setFilterSubjectId(subjectId);
    } else {
      setSearchQuery("");
      setViewingDoc(null);
    }
  }

  const resolvedLevelName = useMemo(() => {
    if (!filterLevelId) return undefined;
    return (
      levels.find((l) => l.id === filterLevelId)?.name ??
      (filterLevelId === levelId ? levelName : undefined)
    );
  }, [filterLevelId, levels, levelId, levelName]);

  const resolvedSubjectName = useMemo(() => {
    if (!filterSubjectId) return undefined;
    return (
      subjects.find((s) => s.id === filterSubjectId)?.name ??
      (filterSubjectId === subjectId ? subjectName : undefined)
    );
  }, [filterSubjectId, subjects, subjectId, subjectName]);

  // Fetch past papers, filtered by level and subject when selected
  const {
    data: resources = [],
    isLoading,
    isError,
  } = useQuery<Resource[]>({
    queryKey: ["pastPaperSelectorResources", filterLevelId, filterSubjectId],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      params.append("resource_type", "PAST_PAPER");
      if (filterLevelId) params.append("level", filterLevelId);
      if (filterSubjectId) params.append("subject", filterSubjectId);

      const res = await apiFetch<
        Resource[] | { data?: Resource[]; results?: Resource[] }
      >(`/resources/files/?${params.toString()}`, token ?? undefined);
      return Array.isArray(res) ? res : res?.data || res?.results || [];
    },
    enabled: isOpen,
  });

  // Filter papers based on search query
  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const q = searchQuery.toLowerCase().trim();
    return resources.filter((r) => {
      const name = (r.file_name || r.title || "").toLowerCase();
      const session = (r.session || "").toLowerCase();
      const type = (r.paper_type || "").toLowerCase();
      const code = (r.paper_code || "").toLowerCase();
      const year = r.year?.toString() || "";
      const subj = (r.subject_details?.name || "").toLowerCase();
      const lvl = (r.level_details?.name || "").toLowerCase();
      return (
        name.includes(q) ||
        session.includes(q) ||
        type.includes(q) ||
        code.includes(q) ||
        year.includes(q) ||
        subj.includes(q) ||
        lvl.includes(q)
      );
    });
  }, [resources, searchQuery]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[94vw] max-w-3xl sm:max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-modal">
          {/* Header */}
          <DialogHeader className="p-5 pb-4 border-b border-border bg-muted/40 space-y-3">
            <div className="flex items-center justify-between gap-4 pr-8">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <BookOpen className="size-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-bold font-heading text-foreground truncate">
                    Select Curated Past Paper
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                    {resolvedLevelName || resolvedSubjectName ? (
                      <>
                        <span>Filtering by:</span>
                        {resolvedLevelName && (
                          <Badge variant="outline" className="text-xs font-semibold py-0 px-2 h-5">
                            {resolvedLevelName}
                          </Badge>
                        )}
                        {resolvedSubjectName && (
                          <Badge variant="secondary" className="text-xs font-semibold py-0 px-2 h-5">
                            {resolvedSubjectName}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span>Browse all curated past papers or narrow by level and subject.</span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Level / Subject Filters + Quick Search */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select
                sizeVariant="sm"
                aria-label="Filter by education level"
                value={filterLevelId}
                onChange={(e) => setFilterLevelId(e.target.value)}
                className="min-h-[44px] sm:min-h-[36px] text-base sm:text-xs"
              >
                <option value="">All education levels</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </Select>

              <Select
                sizeVariant="sm"
                aria-label="Filter by subject"
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="min-h-[44px] sm:min-h-[36px] text-base sm:text-xs"
              >
                <option value="">All subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="text"
                sizeVariant="sm"
                aria-label="Search curated past papers"
                placeholder="Search papers by name, code, or session (e.g. 9709, May / June, QP)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] sm:min-h-[36px] pl-9 pr-11 text-base sm:text-xs"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-0.5 sm:right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Body: Shared Past Papers Folder View */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
                <p className="text-xs font-medium">
                  Loading past papers{resolvedSubjectName ? ` for ${resolvedSubjectName}` : ""}...
                </p>
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
                    : `No past papers have been uploaded yet${resolvedLevelName || resolvedSubjectName ? ` for ${[resolvedLevelName, resolvedSubjectName].filter(Boolean).join(" · ")}` : ""}.`
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
