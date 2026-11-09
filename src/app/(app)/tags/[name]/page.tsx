import { TagDetailClient } from "@/components/features/tags/tag-detail-client";

interface TagPageProps {
  params: Promise<{ name: string }>;
}

export default async function TagDetailPage({ params }: TagPageProps) {
  const { name } = await params;
  const decodedTagName = decodeURIComponent(name || "");

  return <TagDetailClient tagName={decodedTagName} />;
}

