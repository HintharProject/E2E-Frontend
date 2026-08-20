import { requireCreatorOrAdmin } from "@/lib/auth";

export default async function NewLessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCreatorOrAdmin();
  return children;
}
