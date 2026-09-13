"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Megaphone, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAnnouncementsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading } = useQuery<any[]>({
    queryKey: ["adminAnnouncements"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/announcements/", token);
      return Array.isArray(res) ? res : (res?.data || res?.results || []);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/announcements/${id}/`, token as string, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Global Announcements"
          description="Manage platform-wide banners."
        />
        <Button>
          <Plus className="size-4 mr-1" /> New Announcement
        </Button>
      </div>

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">No announcements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted border-b border-line text-ink-muted">
                <tr>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Active</th>
                  <th className="p-4 font-semibold">Expires</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium flex items-center gap-2">
                        <Megaphone className="size-4 text-brand" />
                        {a.title}
                      </div>
                    </td>
                    <td className="p-4">
                      {a.is_active ? (
                        <span className="inline-block rounded-full bg-success/20 px-2 py-1 text-xs text-success">Active</span>
                      ) : (
                        <span className="inline-block rounded-full bg-ink-muted/20 px-2 py-1 text-xs text-ink-muted">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-ink-muted">
                      {a.expires_at ? new Date(a.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="p-4 text-right">
                      <Button size="icon" variant="ghost" className="size-8 text-danger hover:text-danger hover:bg-danger/10" onClick={() => deleteMutation.mutate(a.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
