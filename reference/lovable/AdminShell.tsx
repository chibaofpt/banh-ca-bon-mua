import { ReactNode } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import { LogOut, ClipboardList, QrCode, Package, Gift, Receipt } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
  icon: typeof ClipboardList;
  roles: Array<"ADMIN" | "STAFF">;
}

const TABS: Tab[] = [
  { to: "/staff/orders", label: "Tạo Order", icon: ClipboardList, roles: ["ADMIN", "STAFF"] },
  { to: "/admin/orders-list", label: "Đơn hàng", icon: Receipt, roles: ["ADMIN", "STAFF"] },
  { to: "/staff/scan", label: "Quét QR", icon: QrCode, roles: ["ADMIN", "STAFF"] },
  { to: "/admin/menu", label: "Sản phẩm", icon: Package, roles: ["ADMIN"] },
  { to: "/admin/rewards", label: "Điểm & Voucher", icon: Gift, roles: ["ADMIN"] },
];

const AdminShell = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/admin/login" replace />;

  const tabs = TABS.filter((t) => t.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍵</span>
            <span className="font-serif text-lg font-semibold">Matcha Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs leading-tight">
              <div className="font-medium">{user.name}</div>
              <div className="opacity-80">{user.role === "ADMIN" ? "Quản lý" : "Nhân viên"}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/10 transition"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div
          className={cn(
            "grid",
            tabs.length === 2 && "grid-cols-2",
            tabs.length === 3 && "grid-cols-3",
            tabs.length === 4 && "grid-cols-4",
            tabs.length === 5 && "grid-cols-5",
          )}
        >
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} className={isActive ? "stroke-[2.5]" : ""} />
                  <span className="leading-none text-[11px]">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminShell;
