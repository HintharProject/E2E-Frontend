"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function NewSavedSessionPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      const res = await apiFetch<any>("/saved-sessions/", token, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          is_public: isPublic,
        }),
      });
      
      router.push(`/saved-sessions/${res.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create saved session. You might have reached the limit.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Saved Session" description="Create a focused binder to collect posts, problems, lessons, and papers." />

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6"
      >
        <Field label="Title" htmlFor="saved-session-title" required error={error || undefined}>
          <Input
            id="saved-session-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Organic Chemistry Mechanisms"
            disabled={isLoading}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Make this saved session public
        </label>

        <div className="flex items-center gap-2.5 pt-2 border-t border-border/60">
          <Button type="submit" disabled={isLoading || !title.trim()}>
            {isLoading ? "Creating..." : "Create Saved Session"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
