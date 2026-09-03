"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Plus, Trash2, Folder, File as FileIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminResourcesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const { data: levels = [] } = useQuery<any[]>({
    queryKey: ["levels"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<any>("/levels/", token as string);
      return Array.isArray(res) ? res : res?.results || [];
    }
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<any>("/subjects/", token as string);
      return Array.isArray(res) ? res : res?.results || [];
    }
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<any[]>({
    queryKey: ["adminResourcesTree", selectedLevel, selectedSubject],
    queryFn: async () => {
      if (!selectedLevel || !selectedSubject) return [];
      const token = await getToken();
      const res = await apiFetch<any>(`/resources/categories/?level=${selectedLevel}&subject=${selectedSubject}`, token as string);
      return Array.isArray(res) ? res : res?.results || [];
    },
    enabled: !!selectedLevel && !!selectedSubject,
  });

  // Mutations
  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const token = await getToken();
      return apiFetch("/resources/categories/", token as string, {
        method: "POST",
        body: JSON.stringify({ name, level: selectedLevel, subject: selectedSubject })
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminResourcesTree"] })
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/resources/categories/${id}/`, token as string, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminResourcesTree"] })
  });

  const createSubCategory = useMutation({
    mutationFn: async ({ categoryId, name }: { categoryId: string, name: string }) => {
      const token = await getToken();
      return apiFetch("/resources/subcategories/", token as string, {
        method: "POST",
        body: JSON.stringify({ name, category: categoryId })
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminResourcesTree"] })
  });

  const deleteSubCategory = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/resources/subcategories/${id}/`, token as string, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminResourcesTree"] })
  });

  const deleteFile = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/resources/files/${id}/`, token as string, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminResourcesTree"] })
  });

  const handleAddCategory = () => {
    const name = prompt("Enter category name (e.g. Past Papers):");
    if (name) createCategory.mutate(name);
  };

  const handleAddSubCategory = (categoryId: string) => {
    const name = prompt("Enter sub-category name (e.g. 2023):");
    if (name) createSubCategory.mutate({ categoryId, name });
  };

  const handleFileUpload = async (subcategoryId: string, file: File) => {
    const token = await getToken();
    try {
      // 1. Get presigned URL
      const { upload_url, file_url } = await apiFetch<any>("/resources/files/generate_upload_url/", token as string, {
        method: "POST",
        body: JSON.stringify({ file_name: file.name })
      });

      // 2. Upload directly to B2
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/pdf"
        }
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      // 3. Save to backend
      await apiFetch("/resources/files/", token as string, {
        method: "POST",
        body: JSON.stringify({
          subcategory: subcategoryId,
          file_name: file.name,
          file_url: file_url
        })
      });

      queryClient.invalidateQueries({ queryKey: ["adminResourcesTree"] });
    } catch (e) {
      alert("Error uploading file.");
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resources Management"
        description="Upload and manage L3 Categories, L4 Sub-Categories, and PDFs."
      />
      
      <div className="flex gap-4 p-4 rounded-xl border border-line bg-card">
        <select 
          className="rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
          value={selectedLevel} 
          onChange={e => setSelectedLevel(e.target.value)}
        >
          <option value="">Select Level</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        
        <select 
          className="rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
          value={selectedSubject} 
          onChange={e => setSelectedSubject(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!selectedLevel || !selectedSubject ? (
        <div className="text-center p-12 text-ink-muted border border-line border-dashed rounded-xl">
          Please select a Level and Subject to view resources.
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
            <h3 className="font-medium text-ink">Resource Tree</h3>
            <Button size="sm" onClick={handleAddCategory} disabled={createCategory.isPending}>
              <Plus className="size-4 mr-1" /> Add Category
            </Button>
          </div>
          
          <div className="p-4 flex flex-col gap-4">
            {loadingCategories ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto" />
            ) : categories.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">No categories found. Create one to begin.</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="border border-line rounded-lg overflow-hidden">
                  <div className="bg-surface p-3 flex justify-between items-center border-b border-line">
                    <div className="flex items-center gap-2 font-medium">
                      <Folder className="size-4 text-primary" /> {cat.name} 
                      {cat.is_system && <span className="text-xs bg-muted px-2 py-0.5 rounded text-ink-muted">System</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAddSubCategory(cat.id)}>
                        <Plus className="size-3 mr-1" /> Sub-Category
                      </Button>
                      {!cat.is_system && (
                        <Button size="icon" variant="ghost" className="text-danger size-8" onClick={() => deleteCategory.mutate(cat.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 pl-6 flex flex-col gap-3">
                    {cat.subcategories?.length === 0 && <p className="text-xs text-ink-muted">No sub-categories yet.</p>}
                    {cat.subcategories?.map((sub: any) => (
                      <div key={sub.id} className="border border-line rounded bg-card flex flex-col">
                        <div className="p-2 flex justify-between items-center bg-muted/30 border-b border-line">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Folder className="size-3.5 text-blue-500" /> {sub.name}
                          </div>
                          <div className="flex gap-2 items-center">
                            <label className="text-xs cursor-pointer bg-primary text-primary-foreground px-2 py-1 rounded flex items-center gap-1 hover:bg-primary/90">
                              <Upload className="size-3" /> Upload PDF
                              <input type="file" accept="application/pdf" className="hidden" onChange={e => {
                                if (e.target.files?.[0]) handleFileUpload(sub.id, e.target.files[0]);
                              }} />
                            </label>
                            <Button size="icon" variant="ghost" className="text-danger size-7" onClick={() => deleteSubCategory.mutate(sub.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-2 pl-4 flex flex-col gap-1">
                          {sub.resources?.length === 0 && <p className="text-xs text-ink-muted py-1">No files uploaded.</p>}
                          {sub.resources?.map((file: any) => (
                            <div key={file.id} className="flex justify-between items-center text-sm py-1 hover:bg-muted/50 px-2 rounded">
                              <a href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink hover:underline">
                                <FileIcon className="size-3.5 text-red-500" /> {file.file_name}
                              </a>
                              <Button size="icon" variant="ghost" className="text-danger size-6" onClick={() => deleteFile.mutate(file.id)}>
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
