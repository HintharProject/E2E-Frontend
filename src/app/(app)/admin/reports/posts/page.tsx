import { redirect } from "next/navigation";

export default function AdminPostReportsRedirect() {
  redirect("/admin/reports?tab=post");
}
