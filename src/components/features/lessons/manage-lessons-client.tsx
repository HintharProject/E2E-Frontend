"use client";

import { LessonsFeed } from "@/components/features/lessons-feed";

export function ManageLessonsClient({
  subjects,
  levels,
  tagIds,
  state,
  hideSort = false,
}: {
  subjects: string[];
  levels: string[];
  tagIds: string[];
  state: string;
  hideSort?: boolean;
}) {
  return (
    <LessonsFeed 
      subjects={subjects} 
      levels={levels} 
      tagIds={tagIds} 
      onlyMine={true} 
      state={state} 
      hideSort={hideSort}
    />
  );
}
