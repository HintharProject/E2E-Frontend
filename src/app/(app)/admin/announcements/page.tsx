"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isAdminOrSuperAdmin } from "@/types/user";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AnnouncementDialog } from "@/components/features/admin/announcement-dialog";
import {
  useAnnouncements,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type Announcement,
} from "@/hooks/use-announcements";
import {
  Loader2,
  Megaphone,
  Trash2,
  Plus,
  Pencil,
  Search,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

type FilterStatus = "ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED";

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();

  const isAuthorized = !isUserLoading && !!currentUser && isAdminOrSuperAdmin(currentUser.role);

  useEffect(() => {
    if (!isUserLoading && (!currentUser || !isAdminOrSuperAdmin(currentUser.role))) {
      router.replace("/admin/reports");
    }
  }, [isUserLoading, currentUser, router]);

  // Announcements query (all=true fetches active and inactive)
  const { data: announcements = [], isLoading, refetch } = useAnnouncements({ all: true });

  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<{ id: string; title: string } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    const now = new Date();
    return announcements.filter((a) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesBody = a.body.toLowerCase().includes(q);
        const matchesAuthor = a.author_details?.display_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody && !matchesAuthor) return false;
      }

      // Status
      const isExpired = a.expires_at ? new Date(a.expires_at) <= now : false;

      if (statusFilter === "ACTIVE") {
        return a.is_active && !isExpired;
      }
      if (statusFilter === "INACTIVE") {
        return !a.is_active;
      }
      if (statusFilter === "EXPIRED") {
        return isExpired;
      }
      return true;
    });
  }, [announcements, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    let active = 0;
    let inactive = 0;
    let expired = 0;

    for (const a of announcements) {
      const isExpired = a.expires_at ? new Date(a.expires_at) <= now : false;
      if (isExpired) {
        expired++;
      } else if (a.is_active) {
        active++;
      } else {
        inactive++;
      }
    }

    return { total: announcements.length, active, inactive, expired };
  }, [announcements]);

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setDialogOpen(true);
  };

  const handleToggleActive = async (a: Announcement) => {
    await updateMutation.mutateAsync({
      id: a.id,
      data: { is_active: !a.is_active },
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingAnnouncement) return;
    try {
      await deleteMutation.mutateAsync(deletingAnnouncement.id);
      setDeletingAnnouncement(null);
    } catch {
      // Handled by deleteMutation.onError toast
    }
  };

  if (isUserLoading || !isAuthorized) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Global Announcements"
          description="Create, schedule, and manage platform-wide banners and broadcast notices."
        />
        <Button onClick={handleOpenCreate} className="font-semibold shadow-xs">
          <Plus className="size-4 mr-1.5" /> New Announcement
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Total Notices</p>
          <p className="text-2xl font-black text-ink mt-0.5 tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">Active Live</p>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-0.5 tabular-nums">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Draft / Inactive</p>
          <p className="text-2xl font-black text-ink mt-0.5 tabular-nums">{stats.inactive}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Past / Expired</p>
          <p className="text-2xl font-black text-ink mt-0.5 tabular-nums">{stats.expired}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-line">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <Search className="size-4 text-ink-muted shrink-0" />
          <Input
            placeholder="Search announcements by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs border-none bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {(
            [
              { id: "ALL", label: "All" },
              { id: "ACTIVE", label: "Active" },
              { id: "INACTIVE", label: "Draft" },
              { id: "EXPIRED", label: "Expired" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                statusFilter === filter.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-muted/50"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Table */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-muted/40 border border-line flex items-center justify-center mx-auto text-ink-muted">
              <Megaphone className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">No announcements match your criteria</p>
              <p className="text-xs text-ink-muted mt-1">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search terms or filters."
                  : "Create your first platform announcement to notify students."}
              </p>
            </div>
            {!searchQuery && statusFilter === "ALL" && (
              <Button size="sm" onClick={handleOpenCreate} className="mt-2">
                <Plus className="size-3.5 mr-1" /> Create Announcement
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted/30 border-b border-line text-ink-muted text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Announcement</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Published</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredAnnouncements.map((a) => {
                  const isExpired = a.expires_at ? new Date(a.expires_at) <= new Date() : false;

                  return (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      {/* Title & Preview */}
                      <td className="p-4 max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Megaphone className="size-4 text-primary" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="text-sm font-bold text-ink truncate leading-tight">{a.title}</p>
                            <p className="text-xs text-ink-muted line-clamp-1 leading-snug">{a.body}</p>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            {a.author_details?.profile_image_url && (
                              <AvatarImage src={a.author_details.profile_image_url} />
                            )}
                            <AvatarFallback className="text-[10px] font-bold">
                              {a.author_details?.display_name?.slice(0, 2).toUpperCase() || "AD"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-ink">
                            {a.author_details?.display_name || "Platform Admin"}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4 whitespace-nowrap">
                        {isExpired ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-line bg-muted text-ink-muted"
                            title="This announcement has expired. Edit its expiration date to reactivate."
                          >
                            <span className="size-1.5 rounded-full bg-ink-muted" />
                            Expired
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(a)}
                            title="Click to toggle active status"
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer",
                              a.is_active
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/25"
                                : "bg-muted border-line text-ink-muted hover:text-ink"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                a.is_active ? "bg-emerald-500 animate-pulse" : "bg-ink-muted"
                              )}
                            />
                            {a.is_active ? "Active" : "Inactive"}
                          </button>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="p-4 whitespace-nowrap">
                        {isExpired ? (
                          <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5">
                            Expired
                          </Badge>
                        ) : a.expires_at ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-ink flex items-center gap-1">
                              <Clock className="size-3 text-ink-muted" />
                              {formatDate(a.expires_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-muted italic">Indefinite</span>
                        )}
                      </td>

                      {/* Published */}
                      <td className="p-4 whitespace-nowrap text-xs text-ink-muted">
                        {formatDate(a.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-ink-muted hover:text-ink"
                            onClick={() => handleOpenEdit(a)}
                            title="Edit announcement"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingAnnouncement({ id: a.id, title: a.title })}
                            disabled={deleteMutation.isPending}
                            title="Delete announcement"
                          >
                            <Trash2 className="size-4" />
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

      {/* Create & Edit Modal Dialog */}
      <AnnouncementDialog
        announcement={editingAnnouncement}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deletingAnnouncement}
        onOpenChange={(open) => {
          if (!open) setDeletingAnnouncement(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-background border-line">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-ink">
                  Delete Announcement
                </DialogTitle>
                <DialogDescription className="text-xs text-ink-muted mt-0.5">
                  Are you sure you want to permanently delete this announcement? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingAnnouncement && (
            <div className="my-2 p-3 rounded-xl border border-line bg-muted/30 text-xs font-medium text-ink">
              <span className="text-ink-muted font-normal block mb-0.5">Notice Title:</span>
              &ldquo;{deletingAnnouncement.title}&rdquo;
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingAnnouncement(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="font-semibold"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Notice"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
