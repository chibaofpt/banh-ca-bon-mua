import type { ReactNode } from "react";
import AdminTabBar from "@/src/components/admin/AdminTabBar";
import type { Role } from "@/src/lib/types/user";

// TODO: Replace hardcoded placeholders with real session data.
// Call getSession() from "@/lib/auth" here (server component), then pass
// userName and userRole to AdminTabBar.
const PLACEHOLDER_NAME = "Admin";
const PLACEHOLDER_ROLE: Role = "ADMIN";

/** Layout shell for all admin and staff pages — top bar + bottom tab bar. */
export default function AdminShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminTabBar userName={PLACEHOLDER_NAME} userRole={PLACEHOLDER_ROLE} />
      <main className="flex-1 pb-24">{children}</main>
    </div>
  );
}
