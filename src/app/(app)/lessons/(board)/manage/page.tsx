import { parseFilterList } from "@/lib/filter-params";
import { ManageLessonsClient } from "@/components/features/lessons/manage-lessons-client";

export default async function ManageLessonsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  
  const stateStr = typeof searchParams?.state === "string" ? searchParams.state : undefined;
  const active = (stateStr?.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED";
  
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const tagIds = parseFilterList(searchParams?.tags);

  return (
    <ManageLessonsClient 
      subjects={subjects} 
      levels={levels} 
      tagIds={tagIds} 
      state={active} 
    />
  );
}
