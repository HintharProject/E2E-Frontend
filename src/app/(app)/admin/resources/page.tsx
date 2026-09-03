"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Loader2, 
  Upload, 
  Trash2, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  FilePlus,
  BookOpen,
  GraduationCap,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];

const SESSIONS = [
  { value: "MAY_JUNE", label: "May / June" },
  { value: "OCT_NOV", label: "Oct / Nov" },
  { value: "JANUARY", label: "January" },
];

const PAPER_TYPES = [
  { value: "QP", label: "Question Paper (QP)" },
  { value: "MS", label: "Mark Scheme (MS)" },
];

export default function AdminResourcesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Selection Filters
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Upload Form State
  const [resourceType, setResourceType] = useState<"PAST_PAPER" | "TEXTBOOK">("PAST_PAPER");
  const [year, setYear] = useState<number>(2024);
  const [session, setSession] = useState<string>("MAY_JUNE");
  const [paperType, setPaperType] = useState<string>("QP");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Filter for table view
  const [tableTypeFilter, setTableTypeFilter] = useState<string>("ALL");

  // Fetch Levels & Subjects
  const { data: levels = [] } = useQuery<any[]>({
    queryKey: ["levels"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<any>("/levels/", token as string);
      return Array.isArray(res) ? res : res?.data || res?.results || [];
    },
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<any>("/subjects/", token as string);
      return Array.isArray(res) ? res : res?.data || res?.results || [];
    },
  });

  // Fetch Resources List
  const { data: resources = [], isLoading: loadingResources } = useQuery<any[]>({
    queryKey: ["adminResourcesList", selectedLevel, selectedSubject],
    queryFn: async () => {
      if (!selectedLevel || !selectedSubject) return [];
      const token = await getToken();
      const res = await apiFetch<any>(
        `/resources/files/?level=${selectedLevel}&subject=${selectedSubject}`,
        token as string
      );
      return Array.isArray(res) ? res : res?.data || res?.results || [];
    },
    enabled: !!selectedLevel && !!selectedSubject,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/resources/files/${id}/`, token as string, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminResourcesList"] });
      queryClient.invalidateQueries({ queryKey: ["userResourcesList"] });
    },
  });

  // Handle Direct Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevel || !selectedSubject) {
      setUploadError("Please select both Level and Subject first.");
      return;
    }
    if (!file) {
      setUploadError("Please choose a PDF file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const token = await getToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_name", customTitle.trim() || file.name);
      formData.append("level", selectedLevel);
      formData.append("subject", selectedSubject);
      formData.append("resource_type", resourceType);

      if (resourceType === "PAST_PAPER") {
        formData.append("year", String(year));
        formData.append("session", session);
        formData.append("paper_type", paperType);
      }

      await apiFetch("/resources/files/", token as string, {
        method: "POST",
        body: formData,
      });

      setUploadSuccess(true);
      setFile(null);
      setCustomTitle("");
      queryClient.invalidateQueries({ queryKey: ["adminResourcesList"] });
      queryClient.invalidateQueries({ queryKey: ["userResourcesList"] });

      setTimeout(() => setUploadSuccess(false), 3500);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredResources = resources.filter((item: any) => {
    if (tableTypeFilter === "ALL") return true;
    return item.resource_type === tableTypeFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resources Management"
        description="Upload and manage Past Papers (2019-2026) and Textbooks directly to B2."
      />

      {/* Level & Subject Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-line bg-card">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
            1. Select Level
          </label>
          <select
            className="w-full rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">-- Choose Level --</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
            2. Select Subject
          </label>
          <select
            className="w-full rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedLevel || !selectedSubject ? (
        <div className="text-center p-12 text-ink-muted border border-line border-dashed rounded-xl bg-card">
          <GraduationCap className="size-10 mx-auto text-ink-muted/50 mb-3" />
          <p className="font-medium text-ink">Select a Level and Subject</p>
          <p className="text-xs text-ink-muted mt-1">
            Choose a target Level and Subject above to start uploading and managing resources.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form Card */}
          <div className="lg:col-span-1 rounded-2xl border border-line bg-card p-5 h-fit shadow-xs">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <FilePlus className="size-4 text-primary" /> Upload New Document
            </h3>

            {/* Resource Type Selector */}
            <div className="flex rounded-lg border border-line p-1 bg-surface mb-4">
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  resourceType === "PAST_PAPER"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-ink-muted hover:text-ink"
                }`}
                onClick={() => setResourceType("PAST_PAPER")}
              >
                Past Paper
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  resourceType === "TEXTBOOK"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-ink-muted hover:text-ink"
                }`}
                onClick={() => setResourceType("TEXTBOOK")}
              >
                Textbook
              </button>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-3.5 text-sm">
              {resourceType === "PAST_PAPER" ? (
                <>
                  {/* Year */}
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Exam Year
                    </label>
                    <select
                      className="w-full rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Session */}
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Exam Session
                    </label>
                    <select
                      className="w-full rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                    >
                      {SESSIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paper Type */}
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Paper Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAPER_TYPES.map((pt) => (
                        <button
                          key={pt.value}
                          type="button"
                          className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                            paperType === pt.value
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-line bg-surface text-ink-muted hover:bg-muted"
                          }`}
                          onClick={() => setPaperType(pt.value)}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {/* Title (Optional / Custom) */}
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  {resourceType === "TEXTBOOK" ? "Textbook Title" : "Display Title (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    resourceType === "TEXTBOOK"
                      ? "e.g. Cambridge IGCSE Mathematics 3rd Edition"
                      : "Defaults to file name"
                  }
                  className="w-full rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  PDF File
                </label>
                <div className="border border-line border-dashed rounded-lg p-4 bg-surface text-center hover:bg-muted/40 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    id="resource-file-input"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="resource-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="size-6 text-primary" />
                    <span className="text-xs font-medium text-ink">
                      {file ? file.name : "Choose or drag PDF"}
                    </span>
                    <span className="text-[10px] text-ink-muted">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF format only"}
                    </span>
                  </label>
                </div>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Resource uploaded successfully!</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isUploading || !file}
                className="w-full mt-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" /> Upload Resource
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Resources List & Management */}
          <div className="lg:col-span-2 rounded-2xl border border-line bg-card overflow-hidden flex flex-col shadow-xs">
            <div className="p-4 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink text-base">Uploaded Documents</h3>
                <span className="text-xs bg-muted text-ink-muted px-2 py-0.5 rounded-full font-medium">
                  {filteredResources.length}
                </span>
              </div>

              {/* Type Filter */}
              <div className="flex gap-1 bg-card border border-line p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setTableTypeFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    tableTypeFilter === "ALL" ? "bg-primary text-primary-foreground" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTableTypeFilter("PAST_PAPER")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    tableTypeFilter === "PAST_PAPER" ? "bg-primary text-primary-foreground" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Past Papers
                </button>
                <button
                  type="button"
                  onClick={() => setTableTypeFilter("TEXTBOOK")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    tableTypeFilter === "TEXTBOOK" ? "bg-primary text-primary-foreground" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Textbooks
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-x-auto">
              {loadingResources ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-12 text-ink-muted">
                  <FileText className="size-8 mx-auto text-ink-muted/40 mb-2" />
                  <p className="text-sm font-medium">No documents found.</p>
                  <p className="text-xs text-ink-muted mt-0.5">Upload a past paper or textbook to see it here.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-ink">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      <th className="pb-3 pl-2">Document</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Year / Session</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredResources.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 pl-2 max-w-[220px] truncate font-medium">
                          <div className="flex items-center gap-2">
                            {item.resource_type === "PAST_PAPER" ? (
                              <FileText className="size-4 shrink-0 text-red-500" />
                            ) : (
                              <BookOpen className="size-4 shrink-0 text-blue-500" />
                            )}
                            <span className="truncate" title={item.file_name}>
                              {item.file_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          {item.resource_type === "PAST_PAPER" ? (
                            <Badge variant="outline" className={item.paper_type === "QP" ? "border-amber-500/40 text-amber-600 dark:text-amber-400" : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"}>
                              {item.paper_type || "Past Paper"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Textbook</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap text-xs text-ink-muted">
                          {item.resource_type === "PAST_PAPER" ? (
                            <span>
                              {item.year}{" "}
                              {item.session === "MAY_JUNE"
                                ? "May/June"
                                : item.session === "OCT_NOV"
                                ? "Oct/Nov"
                                : item.session === "JANUARY"
                                ? "Jan"
                                : item.session}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 pr-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center size-8 rounded-lg border border-line bg-surface text-ink hover:bg-muted transition-colors"
                              title="View Document"
                            >
                              <Eye className="size-3.5" />
                            </a>
                            <a
                              href={item.download_url || item.file_url}
                              download={item.file_name}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center size-8 rounded-lg border border-line bg-surface text-ink hover:bg-muted transition-colors"
                              title="Download PDF"
                            >
                              <Download className="size-3.5" />
                            </a>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-danger hover:text-danger hover:bg-danger/10"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${item.file_name}"?`)) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
