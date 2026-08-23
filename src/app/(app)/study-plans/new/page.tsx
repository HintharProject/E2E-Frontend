"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function NewStudyPlanPage() {
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
      
      const res = await apiFetch<any>("/study-plans/", token, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          is_public: isPublic,
        }),
      });
      
      router.push(`/study-plans/${res.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create study plan. You might have reached the limit.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="New Study Plan" description="Create a new plan to organize lessons." />
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Field label="Title">
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. Math Midterm Prep" 
            disabled={isLoading}
          />
          {error && <span className="text-sm text-destructive">{error}</span>}
        </Field>
        
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={isPublic} 
            onChange={(e) => setIsPublic(e.target.checked)} 
            disabled={isLoading}
            className="rounded border-line"
          />
          Make this study plan public
        </label>
        
        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading || !title.trim()}>
            {isLoading ? "Creating..." : "Create Study Plan"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
