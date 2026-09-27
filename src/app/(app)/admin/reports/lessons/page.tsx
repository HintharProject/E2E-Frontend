import { redirect } from "next/navigation";

export default function AdminLessonReportsRedirect() {
  redirect("/admin/reports?tab=lesson");
}
