import { redirect } from "next/navigation";

/** /admin → redirect to /admin/menu */
export default function AdminRootPage() {
  redirect("/admin/menu");
}
