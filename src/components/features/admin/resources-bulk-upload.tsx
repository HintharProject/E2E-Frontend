"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import {
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Files,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  YEARS,
  SESSIONS,
  ACCEPT_STRING,
  BulkQueueItem,
  isValidDocumentFile,
  parseResourceFileName,
  ResourceType,
} from "@/lib/resources";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";

interface ResourcesBulkUploadProps {
  selectedLevel: string;
  selectedSubject: string;
}

export function ResourcesBulkUpload({ selectedLevel, selectedSubject }: ResourcesBulkUploadProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [bulkQueue, setBulkQueue] = useState<BulkQueueItem[]>([]);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  const [batchDefaults, setBatchDefaults] = useState<{
    resourceType: ResourceType;
    year: number;
    session: string;
    paperType: string;
  }>({
    resourceType: "PAST_PAPER",
    year: 2024,
    session: "MAY_JUNE",
    paperType: "QP",
  });

  const handleBulkFilesSelect = (filesList: FileList | File[]) => {
    const newItems: BulkQueueItem[] = [];
    const errors: string[] = [];

    Array.from(filesList).forEach((f) => {
      const parsed = parseResourceFileName(f.name);
      const resType = batchDefaults.resourceType === "TEXTBOOK"
        ? (parsed.resourceType === "PAST_PAPER" ? "PAST_PAPER" : "TEXTBOOK")
        : (parsed.resourceType || batchDefaults.resourceType);

      const val = isValidDocumentFile(f, resType);
      if (!val.valid) {
        errors.push(val.error || `Unsupported file: ${f.name}`);
        return;
      }

      newItems.push({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file: f,
        fileName: f.name,
        resourceType: resType,
        year: parsed.year || batchDefaults.year || 2024,
        session: parsed.session || batchDefaults.session || "MAY_JUNE",
        paperType: parsed.paperType || batchDefaults.paperType || "QP",
        status: "IDLE",
      });
    });

    if (errors.length > 0) {
      setBulkError(errors.join(" | "));
    } else {
      setBulkError(null);
    }

    if (newItems.length > 0) {
      setBulkQueue((prev) => [...prev, ...newItems]);
    }
  };

  const applyBatchDefaultsToAll = () => {
    setBulkQueue((prev) =>
      prev.map((item) => ({
        ...item,
        resourceType: batchDefaults.resourceType,
        year: batchDefaults.year,
        session: batchDefaults.session,
        paperType: batchDefaults.paperType,
      }))
    );
  };

  const updateQueueItem = (id: string, updates: Partial<BulkQueueItem>) => {
    setBulkQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeQueueItem = (id: string) => {
    setBulkQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadBulk = async () => {
    if (!selectedLevel || !selectedSubject) {
      setBulkError("Please select both Level and Subject before starting bulk upload.");
      return;
    }
    const pendingItems = bulkQueue.filter((item) => item.status === "IDLE" || item.status === "ERROR");
    if (pendingItems.length === 0) {
      setBulkError("No pending files in the upload queue.");
      return;
    }

    setIsUploadingBulk(true);
    setBulkError(null);
    setBulkSuccessMessage(null);

    let successCount = 0;
    let failCount = 0;
    const token = await getToken();

    for (const item of pendingItems) {
      updateQueueItem(item.id, { status: "UPLOADING", errorMessage: undefined });
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("file_name", item.fileName.trim() || item.file.name);
        formData.append("level", selectedLevel);
        formData.append("subject", selectedSubject);
        formData.append("resource_type", item.resourceType);

        if (item.resourceType === "PAST_PAPER") {
          formData.append("year", String(item.year));
          formData.append("session", item.session);
          formData.append("paper_type", item.paperType);
        }

        await apiFetch("/resources/files/", token as string, {
          method: "POST",
          body: formData,
        });

        updateQueueItem(item.id, { status: "SUCCESS" });
        successCount++;
      } catch (err: any) {
        updateQueueItem(item.id, {
          status: "ERROR",
          errorMessage: err.message || "Upload failed",
        });
        failCount++;
      }
    }

    setIsUploadingBulk(false);
    queryClient.invalidateQueries({ queryKey: ["adminResourcesList"] });
    queryClient.invalidateQueries({ queryKey: ["userResourcesList"] });

    if (successCount > 0 && failCount === 0) {
      setBulkSuccessMessage(`All ${successCount} files uploaded successfully!`);
      setTimeout(() => setBulkSuccessMessage(null), 5000);
    } else if (successCount > 0 && failCount > 0) {
      setBulkError(`${successCount} uploaded successfully, ${failCount} failed.`);
    } else if (failCount > 0) {
      setBulkError(`Failed to upload ${failCount} files.`);
    }
  };

  const pendingCount = bulkQueue.filter((i) => i.status === "IDLE" || i.status === "ERROR").length;

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* Batch Defaults Controls */}
      <div className="p-3.5 rounded-xl border border-line bg-surface flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" /> Batch Defaults
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-[11px] h-6 text-primary hover:text-primary font-medium"
            onClick={applyBatchDefaultsToAll}
            disabled={bulkQueue.length === 0}
          >
            Apply to All ({bulkQueue.length})
          </Button>
        </div>

        <div className={`grid ${batchDefaults.resourceType === "PAST_PAPER" ? "grid-cols-3" : "grid-cols-1"} gap-2 text-xs`}>
          <div>
            <label className="text-[10px] text-ink-muted block mb-0.5">Type</label>
            <select
              className="w-full rounded-md border border-line px-2 py-1.5 bg-card text-xs"
              value={batchDefaults.resourceType}
              onChange={(e) =>
                setBatchDefaults((prev) => ({
                  ...prev,
                  resourceType: e.target.value as ResourceType,
                }))
              }
            >
              <option value="PAST_PAPER">Past Paper</option>
              <option value="TEXTBOOK">Textbook / Document</option>
            </select>
          </div>

          {batchDefaults.resourceType === "PAST_PAPER" && (
            <>
              <div>
                <label className="text-[10px] text-ink-muted block mb-0.5">Default Year</label>
                <select
                  className="w-full rounded-md border border-line px-2 py-1.5 bg-card text-xs"
                  value={batchDefaults.year}
                  onChange={(e) =>
                    setBatchDefaults((prev) => ({
                      ...prev,
                      year: Number(e.target.value),
                    }))
                  }
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-ink-muted block mb-0.5">Default Session</label>
                <select
                  className="w-full rounded-md border border-line px-2 py-1.5 bg-card text-xs"
                  value={batchDefaults.session}
                  onChange={(e) =>
                    setBatchDefaults((prev) => ({
                      ...prev,
                      session: e.target.value,
                    }))
                  }
                >
                  {SESSIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Multi-File Dropzone */}
      <div
        className="border-2 border-line border-dashed rounded-xl p-5 bg-surface text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) handleBulkFilesSelect(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          multiple
          accept={ACCEPT_STRING}
          id="bulk-resource-file-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleBulkFilesSelect(e.target.files);
              e.target.value = "";
            }
          }}
        />
        <label
          htmlFor="bulk-resource-file-input"
          className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
        >
          <Files className="size-8 text-primary" />
          <span className="text-xs font-semibold text-ink">
            Drop multiple files here, or click to browse
          </span>
          <span className="text-[11px] text-ink-muted max-w-xs">
            Auto-detects details from filenames. Up to 50MB for Past Papers, 300MB for Textbooks & ZIP bundles.
          </span>
        </label>
      </div>

      {bulkError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{bulkError}</span>
        </div>
      )}

      {bulkSuccessMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{bulkSuccessMessage}</span>
        </div>
      )}

      {/* Queued Items List */}
      {bulkQueue.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Queued Files ({bulkQueue.length})</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkQueue((prev) => prev.filter((i) => i.status !== "SUCCESS"))}
                className="text-[11px] text-ink-muted hover:text-ink underline"
              >
                Clear Done
              </button>
              <button
                type="button"
                onClick={() => setBulkQueue([])}
                className="text-[11px] text-danger hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          {bulkQueue.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-line bg-surface/60 flex flex-col gap-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <DocTypeIcon filename={item.file.name} resourceType={item.resourceType} />
                  <input
                    type="text"
                    className="font-medium text-ink text-xs bg-transparent border-b border-transparent hover:border-line focus:border-primary focus:bg-card px-1 py-0.5 rounded flex-1 truncate"
                    value={item.fileName}
                    onChange={(e) => updateQueueItem(item.id, { fileName: e.target.value })}
                    disabled={item.status === "UPLOADING" || item.status === "SUCCESS"}
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === "IDLE" && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      Ready
                    </Badge>
                  )}
                  {item.status === "UPLOADING" && (
                    <Badge variant="secondary" className="text-[10px] py-0 text-primary flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" /> Uploading
                    </Badge>
                  )}
                  {item.status === "SUCCESS" && (
                    <Badge variant="secondary" className="text-[10px] py-0 bg-green-500/10 text-green-600 dark:text-green-400">
                      Done
                    </Badge>
                  )}
                  {item.status === "ERROR" && (
                    <Badge variant="destructive" className="text-[10px] py-0">
                      Error
                    </Badge>
                  )}

                  <button
                    type="button"
                    onClick={() => removeQueueItem(item.id)}
                    disabled={item.status === "UPLOADING"}
                    className="text-ink-muted hover:text-danger p-0.5 rounded"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Editable item fields */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-line/60">
                <select
                  className="rounded border border-line px-1.5 py-1 bg-card text-[11px]"
                  value={item.resourceType}
                  onChange={(e) => updateQueueItem(item.id, { resourceType: e.target.value as ResourceType })}
                  disabled={item.status === "UPLOADING" || item.status === "SUCCESS"}
                >
                  <option value="PAST_PAPER">Past Paper</option>
                  <option value="TEXTBOOK">Textbook</option>
                </select>

                {item.resourceType === "PAST_PAPER" ? (
                  <>
                    <select
                      className="rounded border border-line px-1.5 py-1 bg-card text-[11px]"
                      value={item.year}
                      onChange={(e) => updateQueueItem(item.id, { year: Number(e.target.value) })}
                      disabled={item.status === "UPLOADING" || item.status === "SUCCESS"}
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>

                    <select
                      className="rounded border border-line px-1.5 py-1 bg-card text-[11px]"
                      value={item.session}
                      onChange={(e) => updateQueueItem(item.id, { session: e.target.value })}
                      disabled={item.status === "UPLOADING" || item.status === "SUCCESS"}
                    >
                      {SESSIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <select
                      className="rounded border border-line px-1.5 py-1 bg-card text-[11px]"
                      value={item.paperType}
                      onChange={(e) => updateQueueItem(item.id, { paperType: e.target.value })}
                      disabled={item.status === "UPLOADING" || item.status === "SUCCESS"}
                    >
                      <option value="QP">QP</option>
                      <option value="MS">MS</option>
                    </select>
                  </>
                ) : (
                  <div className="col-span-3 text-[10px] text-ink-muted flex items-center px-1">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB document
                  </div>
                )}
              </div>

              {item.errorMessage && (
                <p className="text-[10px] text-danger">{item.errorMessage}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        onClick={handleUploadBulk}
        disabled={isUploadingBulk || pendingCount === 0}
        className="w-full"
      >
        {isUploadingBulk ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" /> Uploading Batch...
          </>
        ) : (
          <>
            <Upload className="size-4 mr-2" />
            Upload All ({pendingCount} files)
          </>
        )}
      </Button>
    </div>
  );
}
