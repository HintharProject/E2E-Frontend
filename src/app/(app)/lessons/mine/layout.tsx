import { requireCreatorOrAdmin } from "@/lib/auth";

export default async function MyLessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCreatorOrAdmin();
  return children;
}
