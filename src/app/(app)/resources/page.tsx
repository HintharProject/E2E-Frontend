"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, Folder, File as FileIcon, ChevronRight, ChevronDown } from "lucide-react";
import { parseFilterList } from "@/lib/filter-params";
import { Button, buttonVariants } from "@/components/ui/button";

function ResourcesFeed() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));

  const subjectId = subjects.length > 0 ? subjects[0] : "";
  const levelId = levels.length > 0 ? levels[0] : "";

  const { data: categories = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["userResourcesTree", levelId, subjectId],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (levelId) params.append("level", levelId);
      if (subjectId) params.append("subject", subjectId);
      
      const res = await apiFetch<any>(`/resources/categories/?${params.toString()}`, token as string);
      return Array.isArray(res) ? res : res?.results || [];
    },
  });

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [expandedSubCats, setExpandedSubCats] = useState<Record<string, boolean>>({});

  const toggleCat = (id: string) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSubCat = (id: string) => setExpandedSubCats(prev => ({ ...prev, [id]: !prev[id] }));

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load resources"
        description="We ran into an issue retrieving the data. Please try again."
      />
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No resources found"
        description="There are currently no resources available for the selected Subject and Level."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="p-4 border-b border-line bg-surface">
          <h3 className="font-semibold text-lg text-ink">Directory</h3>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {categories.map((cat: any) => (
            <div key={cat.id} className="flex flex-col border border-line rounded-lg overflow-hidden bg-surface/30">
              <button 
                onClick={() => toggleCat(cat.id)}
                className="flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors w-full focus:outline-none"
              >
                {expandedCats[cat.id] ? <ChevronDown className="size-4 text-ink-muted" /> : <ChevronRight className="size-4 text-ink-muted" />}
                <Folder className="size-5 text-primary" />
                <span className="font-medium text-ink text-sm">{cat.name}</span>
                <span className="ml-auto text-xs text-ink-muted">{cat.subcategories?.length || 0} sub-categories</span>
              </button>
              
              {expandedCats[cat.id] && (
                <div className="pl-6 pr-3 py-2 pb-3 flex flex-col gap-2 border-t border-line bg-card">
                  {cat.subcategories?.length === 0 && <p className="text-xs text-ink-muted p-2">Empty folder.</p>}
                  
                  {cat.subcategories?.map((sub: any) => (
                    <div key={sub.id} className="flex flex-col border border-line rounded bg-surface/50 overflow-hidden">
                      <button 
                        onClick={() => toggleSubCat(sub.id)}
                        className="flex items-center gap-2 p-2 px-3 text-left hover:bg-muted/50 transition-colors w-full focus:outline-none"
                      >
                        {expandedSubCats[sub.id] ? <ChevronDown className="size-3.5 text-ink-muted" /> : <ChevronRight className="size-3.5 text-ink-muted" />}
                        <Folder className="size-4 text-blue-500" />
                        <span className="font-medium text-ink text-sm">{sub.name}</span>
                        <span className="ml-auto text-xs text-ink-muted">{sub.resources?.length || 0} files</span>
                      </button>

                      {expandedSubCats[sub.id] && (
                        <div className="pl-8 pr-2 py-2 flex flex-col gap-1 border-t border-line bg-card">
                          {sub.resources?.length === 0 && <p className="text-xs text-ink-muted">No files in this folder.</p>}
                          {sub.resources?.map((file: any) => (
                            <div key={file.id} className="flex justify-between items-center text-sm py-1.5 px-3 hover:bg-muted/50 rounded-lg group transition-colors">
                              <div className="flex items-center gap-2 text-ink">
                                <FileIcon className="size-4 text-red-500" /> 
                                <span>{file.file_name}</span>
                              </div>
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className={buttonVariants({
                                  variant: "secondary",
                                  size: "sm",
                                  className: "h-7 px-3 opacity-0 group-hover:opacity-100 transition-opacity",
                                })}
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-3 sm:px-6">
      <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar hideTags />
        </Suspense>
        <div className="min-w-0 flex-1 lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:custom-scrollbar lg:pr-2">
          <Suspense fallback={<div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>}>
            <ResourcesFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
