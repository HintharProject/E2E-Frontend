import { parseFilterList } from "@/lib/filter-params";
import { LessonsFeed } from "@/components/features/lessons-feed";

export default async function LessonsBoardPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const tagIds = parseFilterList(searchParams?.tags);

  return (
    <LessonsFeed 
      subjects={subjects} 
      levels={levels} 
      tagIds={tagIds} 
    />
  );
}
