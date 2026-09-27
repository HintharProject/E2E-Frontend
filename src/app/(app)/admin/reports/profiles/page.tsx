import { redirect } from "next/navigation";

export default function AdminProfileReportsRedirect() {
  redirect("/admin/reports?tab=user");
}
