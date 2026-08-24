"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { LessonsFeed } from "@/components/features/lessons-feed";

export function ManageLessonsClient({
  subjects,
  levels,
  tagIds,
  state,
}: {
  subjects: string[];
  levels: string[];
  tagIds: string[];
  state: string;
}) {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <LessonsFeed 
      subjects={subjects} 
      levels={levels} 
      tagIds={tagIds} 
      onlyMine={!isAdmin} 
      state={state} 
    />
  );
}
