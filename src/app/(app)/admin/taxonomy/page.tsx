"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function TaxonomySection({ 
  title, 
  endpoint, 
  queryKey, 
  onEdit 
}: { 
  title: string; 
  endpoint: string; 
  queryKey: string;
  onEdit?: (item: any) => void;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<any>(endpoint, token as string);
      return Array.isArray(res) ? res : (res?.data || res?.results || []);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`${endpoint}${id}/`, token as string, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    }
  });

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
        <h3 className="font-medium text-ink">{title}</h3>
        <Button size="sm" variant="outline" className="h-8">
          <Plus className="size-4 mr-1" /> Add New
        </Button>
      </div>
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <table className="w-full text-left text-sm text-ink">
          <tbody className="divide-y divide-line">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" className="size-8 text-ink-muted hover:text-ink">
                      <Edit2 className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-danger hover:text-danger hover:bg-danger/10" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={2} className="p-8 text-center text-ink-muted">No {title.toLowerCase()} found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TagsSection() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["adminTags", search],
    queryFn: async () => {
      const token = await getToken();
      const qs = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await apiFetch<any>(`/tags/${qs}`, token as string);
      return Array.isArray(res) ? res : (res?.data || res?.results || []);
    }
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ primary_tag_id, merge_tag_ids }: { primary_tag_id: string, merge_tag_ids: string[] }) => {
      const token = await getToken();
      return apiFetch(`/tags/merge/`, token as string, {
        method: "POST",
        body: JSON.stringify({ primary_tag_id, merge_tag_ids })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTags"] });
      alert("Tags merged successfully");
    }
  });

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 border-b border-line bg-surface">
        <h3 className="font-medium text-ink">Tags & Merging</h3>
        <input
          type="text"
          placeholder="Search tags to merge..."
          className="w-full max-w-sm rounded-lg border border-line bg-card py-2 px-3 text-sm focus:border-primary focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <p className="text-xs text-ink-muted">To merge tags, you would select multiple tags and pick a primary one. UI implementation simplified for MVP.</p>
      </div>
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 p-4">
          {data.map(t => (
            <div key={t.id} className="rounded-full bg-muted px-3 py-1 text-sm border border-line">
              {t.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTaxonomyPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Taxonomy Management"
        description="Manage Subjects, Levels, and Tags."
      />
      <div className="grid md:grid-cols-2 gap-6">
        <TaxonomySection title="Subjects" endpoint="/subjects/" queryKey="adminSubjects" />
        <TaxonomySection title="Levels" endpoint="/levels/" queryKey="adminLevels" />
      </div>
      <TagsSection />
    </div>
  );
}
