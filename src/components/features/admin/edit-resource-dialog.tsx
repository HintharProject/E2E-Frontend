"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, AlertCircle } from "lucide-react";
import {
  YEARS,
  SESSIONS,
  ACCEPT_STRING,
  isValidDocumentFile,
  ResourceType,
} from "@/lib/resources";

interface EditResourceDialogProps {
  resource: any | null;
  levels: any[];
  subjects: any[];
  onClose: () => void;
}

export function EditResourceDialog({
  resource,
  levels,
  subjects,
  onClose,
}: EditResourceDialogProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [editFileName, setEditFileName] = useState("");
  const [editResourceType, setEditResourceType] = useState<ResourceType>("PAST_PAPER");
  const [editLevel, setEditLevel] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editYear, setEditYear] = useState<number>(2024);
  const [editSession, setEditSession] = useState("MAY_JUNE");
  const [editPaperType, setEditPaperType] = useState("QP");
  const [editReplacementFile, setEditReplacementFile] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (resource) {
      setEditFileName(resource.file_name || "");
      setEditResourceType(resource.resource_type || "PAST_PAPER");
      setEditLevel(resource.level || "");
      setEditSubject(resource.subject || "");
      setEditYear(resource.year || 2024);
      setEditSession(resource.session || "MAY_JUNE");
      setEditPaperType(resource.paper_type || "QP");
      setEditReplacementFile(null);
      setEditError(null);
    }
  }, [resource]);

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; formData: FormData }) => {
      const token = await getToken();
      return apiFetch(`/resources/files/${payload.id}/`, token as string, {
        method: "PATCH",
        body: payload.formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminResourcesList"] });
      queryClient.invalidateQueries({ queryKey: ["userResourcesList"] });
      onClose();
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update document metadata.");
    },
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;
    if (!editFileName.trim()) {
      setEditError("Document name is required.");
      return;
    }
    if (!editLevel || !editSubject) {
      setEditError("Level and Subject are required.");
      return;
    }

    const formData = new FormData();
    formData.append("file_name", editFileName.trim());
    formData.append("level", editLevel);
    formData.append("subject", editSubject);
    formData.append("resource_type", editResourceType);

    if (editResourceType === "PAST_PAPER") {
      formData.append("year", String(editYear));
      formData.append("session", editSession);
      formData.append("paper_type", editPaperType);
    }

    if (editReplacementFile) {
      const val = isValidDocumentFile(editReplacementFile, editResourceType);
      if (!val.valid) {
        setEditError(val.error || "Invalid replacement file format.");
        return;
      }
      formData.append("file", editReplacementFile);
    }

    editMutation.mutate({ id: resource.id, formData });
  };

  return (
    <Dialog open={!!resource} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4 text-primary" /> Edit Document Details
          </DialogTitle>
        </DialogHeader>

        {resource && (
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5 text-xs py-2">
            {/* Document Name */}
            <div>
              <label className="block font-medium text-ink-muted mb-1">
                Document / File Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-line px-3 py-2 bg-surface text-sm focus:outline-primary"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                placeholder="e.g. 0580_s23_qp_21.pdf"
                required
              />
            </div>

            {/* Resource Type */}
            <div>
              <label className="block font-medium text-ink-muted mb-1">
                Resource Type
              </label>
              <div className="flex rounded-lg border border-line p-0.5 bg-surface">
                <button
                  type="button"
                  className={`flex-1 py-1.5 font-semibold rounded-md transition-colors ${
                    editResourceType === "PAST_PAPER"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  onClick={() => setEditResourceType("PAST_PAPER")}
                >
                  Past Paper
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 font-semibold rounded-md transition-colors ${
                    editResourceType === "TEXTBOOK"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  onClick={() => setEditResourceType("TEXTBOOK")}
                >
                  Textbook / General
                </button>
              </div>
            </div>

            {/* Level & Subject */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-ink-muted mb-1">
                  Level
                </label>
                <select
                  className="w-full rounded-lg border border-line px-2.5 py-1.5 bg-surface text-xs focus:outline-primary"
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value)}
                >
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink-muted mb-1">
                  Subject
                </label>
                <select
                  className="w-full rounded-lg border border-line px-2.5 py-1.5 bg-surface text-xs focus:outline-primary"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Past Paper Fields */}
            {editResourceType === "PAST_PAPER" && (
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-line bg-surface/50">
                <div>
                  <label className="block text-[11px] font-medium text-ink-muted mb-1">
                    Exam Year
                  </label>
                  <select
                    className="w-full rounded-lg border border-line px-2 py-1.5 bg-card text-xs focus:outline-primary"
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-ink-muted mb-1">
                    Session
                  </label>
                  <select
                    className="w-full rounded-lg border border-line px-2 py-1.5 bg-card text-xs focus:outline-primary"
                    value={editSession}
                    onChange={(e) => setEditSession(e.target.value)}
                  >
                    {SESSIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-ink-muted mb-1">
                    Paper Type
                  </label>
                  <select
                    className="w-full rounded-lg border border-line px-2 py-1.5 bg-card text-xs focus:outline-primary"
                    value={editPaperType}
                    onChange={(e) => setEditPaperType(e.target.value)}
                  >
                    <option value="QP">Question Paper (QP)</option>
                    <option value="MS">Mark Scheme (MS)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Optional Replacement File */}
            <div>
              <label className="block font-medium text-ink-muted mb-1">
                Replace Attachment (Optional)
              </label>
              <input
                type="file"
                accept={ACCEPT_STRING}
                className="w-full rounded-lg border border-line px-3 py-1.5 bg-surface text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground"
                onChange={(e) => setEditReplacementFile(e.target.files?.[0] || null)}
              />
              <span className="text-[10px] text-ink-muted mt-0.5 block">
                Leave empty to keep the current file attached.
              </span>
            </div>

            {editError && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <DialogFooter className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={editMutation.isPending}>
                {editMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
