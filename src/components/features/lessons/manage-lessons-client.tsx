"use client";

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
  return (
    <LessonsFeed 
      subjects={subjects} 
      levels={levels} 
      tagIds={tagIds} 
      onlyMine={true} 
      state={state} 
    />
  );
}
