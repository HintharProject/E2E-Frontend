"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSavedSessions, useAddSavedSessionItem } from "@/hooks/use-collections";

export function SaveToSessionDialog({ postId, lessonId }: { postId?: string; lessonId?: string }) {
  const [open, setOpen] = useState(false);
  const { data: sessionsResponse, isLoading } = useSavedSessions();
  const addMutation = useAddSavedSessionItem();

  const handleSave = async (sessionId: string) => {
    try {
      await addMutation.mutateAsync({ sessionId, postId, lessonId });
      alert("Successfully added to session!");
      setOpen(false);
    } catch (err: any) {
      alert("Failed to save to session. It may already be in the session, or you've reached a limit.");
    }
  };

  const sessions = sessionsResponse?.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" />}>
        Save to session
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Session</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          {isLoading && <p className="text-sm text-ink-muted">Loading your sessions...</p>}
          {!isLoading && sessions.length === 0 && (
            <p className="text-sm text-ink-muted">You do not have any saved sessions.</p>
          )}
          {sessions.map((session: any) => (
            <div key={session.id} className="flex items-center justify-between rounded-lg border border-line p-3">
              <span className="text-sm font-medium">{session.title || session.name}</span>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleSave(session.id)}
                disabled={addMutation.isPending}
              >
                Save
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
