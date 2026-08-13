import { redirect } from "next/navigation";

/** Auth-first: mock session treats everyone as signed in → forum. */
export default function HomePage() {
  redirect("/forum");
}
