import { requireCreatorOrAdmin } from "@/lib/auth";

export default async function EditLessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCreatorOrAdmin();
  return children;
}
