"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Search,
  GitMerge,
  Tag as TagIcon,
} from "lucide-react";
import {
  useTagsWithMetrics,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useMergeTags,
  TagItem,
} from "@/hooks/use-exam-taxonomy";
import { ConfirmDialog } from "./confirm-dialog";

export function TagsMergeStudioSection() {
  const [search, setSearch] = useState("");
  const { data: rawTags = [], isLoading } = useTagsWithMetrics(search);
  const tags = useMemo(() => {
    return [...rawTags].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [rawTags]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTagsMap, setSelectedTagsMap] = useState<Record<string, TagItem>>({});
  const [primaryTagId, setPrimaryTagId] = useState<string>("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagNameInput, setTagNameInput] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const mergeTagsMutation = useMergeTags();

  // Keep selected tags cached so search queries don't wipe their labels or metrics
  useEffect(() => {
    if (tags.length > 0) {
      setSelectedTagsMap((prev) => {
        const next = { ...prev };
        tags.forEach((t) => {
          if (selectedTagIds.includes(t.id)) {
            next[t.id] = t;
          }
        });
        return next;
      });
    }
  }, [tags, selectedTagIds]);

  const handleToggleSelect = (tag: TagItem) => {
    setSelectedTagIds((prev) => {
      const exists = prev.includes(tag.id);
      const next = exists ? prev.filter((item) => item !== tag.id) : [...prev, tag.id];
      if (!exists) {
        setSelectedTagsMap((m) => ({ ...m, [tag.id]: tag }));
        if (next.length === 1) setPrimaryTagId(tag.id);
      } else {
        if (primaryTagId === tag.id) setPrimaryTagId(next[0] || "");
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTagIds.length === tags.length && tags.length > 0) {
      setSelectedTagIds([]);
      setPrimaryTagId("");
    } else {
      const allIds = tags.map((t) => t.id);
      setSelectedTagIds(allIds);
      const nextMap: Record<string, TagItem> = { ...selectedTagsMap };
      tags.forEach((t) => {
        nextMap[t.id] = t;
      });
      setSelectedTagsMap(nextMap);
      if (!primaryTagId && allIds.length > 0) {
        setPrimaryTagId(allIds[0]);
      }
    }
  };

  const handleExecuteMerge = () => {
    if (!primaryTagId || selectedTagIds.length < 2) return;
    const mergeIds = selectedTagIds.filter((id) => id !== primaryTagId);
    const targetTag = selectedTagsMap[primaryTagId] || tags.find((t) => t.id === primaryTagId);

    setConfirmModal({
      isOpen: true,
      title: `Merge ${mergeIds.length} Tags into #${targetTag?.name || "Target"}`,
      description: `Are you sure you want to merge ${mergeIds.length} tag(s) into #${targetTag?.name}? All forum posts and lessons tagged with the source tags will be permanently re-linked to #${targetTag?.name}, and the source tags will be deleted.`,
      confirmLabel: "Merge Tags",
      onConfirm: async () => {
        await mergeTagsMutation.mutateAsync({
          primary_tag_id: primaryTagId,
          merge_tag_ids: mergeIds,
        });
        setSelectedTagIds([]);
        setPrimaryTagId("");
        setConfirmModal(null);
      },
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagNameInput.trim()) return;
    await createTagMutation.mutateAsync({ name: tagNameInput.trim() });
    setTagNameInput("");
    setIsAddOpen(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !tagNameInput.trim()) return;
    await updateTagMutation.mutateAsync({ id: editingTag.id, name: tagNameInput.trim() });
    setTagNameInput("");
    setEditingTag(null);
  };

  const selectedTags = selectedTagIds
    .map((id) => selectedTagsMap[id] || tags.find((t) => t.id === id))
    .filter(Boolean) as TagItem[];
  const totalAffectedPosts = selectedTags
    .filter((t) => t.id !== primaryTagId)
    .reduce((acc, t) => acc + (t.post_count || 0), 0);
  const totalAffectedLessons = selectedTags
    .filter((t) => t.id !== primaryTagId)
    .reduce((acc, t) => acc + (t.lesson_count || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Studio Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              sizeVariant="sm"
              aria-label="Search tags by name"
              placeholder="Search tags by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              setTagNameInput("");
              setIsAddOpen(true);
            }}
            className="h-9 gap-1.5 text-xs"
          >
            <Plus className="size-4" aria-hidden="true" /> Add Tag
          </Button>
        </div>
      </div>

      {/* Tags Data Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <TagIcon className="size-8 text-muted-foreground/50 mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">No tags found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search query or create a new tag.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all tags"
                      className="rounded border-border"
                      checked={selectedTagIds.length === tags.length && tags.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="p-3">Tag Name</th>
                  <th scope="col" className="p-3 text-center">Forum Posts</th>
                  <th scope="col" className="p-3 text-center">Lessons</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isPrimary = tag.id === primaryTagId;

                  return (
                    <tr
                      key={tag.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select tag #${tag.name}`}
                          className="rounded border-border"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tag)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">#{tag.name}</span>
                          {isPrimary && selectedTagIds.length > 1 && (
                            <Badge variant="default" className="text-[10px] py-0">
                              Primary Target
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] font-medium bg-muted/40 text-foreground border border-border">
                          {tag.post_count || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] font-medium bg-muted/40 text-foreground border border-border">
                          {tag.lesson_count || 0}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Rename tag #${tag.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingTag(tag);
                              setTagNameInput(tag.name);
                            }}
                          >
                            <Edit2 className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete tag #${tag.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: `Delete Tag #${tag.name}`,
                                description: `Are you sure you want to delete tag #${tag.name}? It will be unlinked from ${tag.post_count || 0} posts and ${tag.lesson_count || 0} lessons.`,
                                confirmLabel: "Delete Tag",
                                onConfirm: async () => {
                                  await deleteTagMutation.mutateAsync(tag.id);
                                  setConfirmModal(null);
                                },
                              });
                            }}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Interactive Merge Studio Dock */}
      {selectedTagIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-3xl rounded-2xl border border-border bg-card shadow-modal p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <GitMerge className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">
                  Merge Studio (<span className="font-mono tabular-nums">{selectedTagIds.length}</span> tags selected)
                </span>
                <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
                  Consolidating {totalAffectedPosts} posts, {totalAffectedLessons} lessons
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <label htmlFor="merge-target-tag" className="text-[11px] text-muted-foreground shrink-0">
                  Designate Target Tag:
                </label>
                <Select
                  id="merge-target-tag"
                  sizeVariant="sm"
                  value={primaryTagId}
                  onChange={(e) => setPrimaryTagId(e.target.value)}
                  className="w-auto min-w-[140px] h-8 min-h-[32px] font-semibold"
                >
                  {selectedTags.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                setSelectedTagIds([]);
                setPrimaryTagId("");
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={handleExecuteMerge}
              disabled={mergeTagsMutation.isPending || !primaryTagId}
            >
              {mergeTagsMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <GitMerge className="size-3.5" aria-hidden="true" />
              )}
              Execute Merge
            </Button>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card p-5 shadow-modal">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="font-semibold text-sm text-foreground">Create New Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <label htmlFor="create-tag-name" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Tag Name (lowercase, no spaces)
              </label>
              <Input
                id="create-tag-name"
                type="text"
                placeholder="e.g. thermodynamics"
                value={tagNameInput}
                onChange={(e) => setTagNameInput(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                required
                autoFocus
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createTagMutation.isPending || !tagNameInput.trim()}
              >
                {createTagMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" aria-hidden="true" /> : null}
                Create Tag
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Modal */}
      <Dialog open={Boolean(editingTag)} onOpenChange={(nextOpen) => !nextOpen && setEditingTag(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card p-5 shadow-modal">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="font-semibold text-sm text-foreground">Rename Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <label htmlFor="rename-tag-name" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Tag Name
              </label>
              <Input
                id="rename-tag-name"
                type="text"
                value={tagNameInput}
                onChange={(e) => setTagNameInput(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                required
                autoFocus
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTag(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateTagMutation.isPending || !tagNameInput.trim()}
              >
                {updateTagMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" aria-hidden="true" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title || ""}
        description={confirmModal?.description || ""}
        confirmLabel={confirmModal?.confirmLabel || "Confirm"}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
        isLoading={mergeTagsMutation.isPending || deleteTagMutation.isPending}
      />
    </div>
  );
}
