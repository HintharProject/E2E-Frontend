import { requireRole } from "@/lib/auth";

export default async function MyLessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["CREATOR"]);
  return children;
}

