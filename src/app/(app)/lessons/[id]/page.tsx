import { LessonDetailClient } from "@/components/features/lessons/lesson-detail-client";

export default async function LessonDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return <LessonDetailClient id={id} />;
}
