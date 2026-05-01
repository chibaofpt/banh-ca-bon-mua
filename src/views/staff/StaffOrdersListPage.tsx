"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Phone, Clock } from "lucide-react";
import { cn } from "@/src/utils/cn";

// TODO: Replace with real data fetched via adminOrderService.listOrders()
// GET /api/admin/orders — returns orders sorted newest first

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  status: "COMPLETED" | "CANCELLED";
  items: OrderItem[];
  /** Total in VND (integer). Display as total_vnd / 1000 cá. */
  total_vnd: number;
}

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// TODO: Replace hardcoded placeholder role with real session — role determines
// whether the "Huỷ đơn" button appears. ADMIN can cancel; STAFF cannot.
const IS_ADMIN_PLACEHOLDER = true;

/** StaffOrdersListPage — lists all orders, newest first. ADMIN can cancel. */
export default function StaffOrdersListPage() {
  // TODO: replace with useEffect → adminOrderService.listOrders()
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const toggle = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const confirmCancel = () => {
    if (!cancelTarget) return;
    // TODO: wire PATCH /api/admin/orders/[id]/status → { status: "CANCELLED" }
    // via adminOrderService.updateStatus(cancelTarget.id, "CANCELLED")
    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelTarget.id ? { ...o, status: "CANCELLED" } : o,
      ),
    );
    console.warn("TODO: wire toast — Đã huỷ đơn", cancelTarget.id);
    setCancelTarget(null);
  };

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="h-6 w-32 bg-secondary/40 rounded-lg animate-pulse mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-secondary/40 rounded-2xl animate-pulse mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-xl font-semibold text-foreground">Đơn hàng</h1>
        <span className="text-xs text-muted-foreground">{orders.length} đơn</span>
      </div>

      {orders.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">Chưa có đơn hàng nào.</p>
      )}

      {orders.map((order) => {
        const isOpen = !!expanded[order.id];
        const cancelled = order.status === "CANCELLED";
        return (
          <div
            key={order.id}
            className={cn(
              "rounded-2xl border bg-card shadow-sm overflow-hidden",
              cancelled && "opacity-80",
            )}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                      {order.customerName}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      #{order.id}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} />
                      {order.customerPhone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium",
                    cancelled
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {cancelled ? "CANCELLED" : "COMPLETED"}
                </span>
              </div>

              <button
                onClick={() => toggle(order.id)}
                className="w-full flex items-center justify-between text-sm text-foreground/80 hover:text-foreground"
              >
                <span>
                  {order.items.reduce((s, i) => s + i.quantity, 0)} món
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isOpen && (
                <ul className="space-y-1 text-sm text-foreground/90 border-t border-border pt-2">
                  {order.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between gap-3">
                      <span className="truncate">{it.name}</span>
                      <span className="text-muted-foreground shrink-0">×{it.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Tổng tiền</span>
                <span className="font-semibold text-foreground">
                  🐟 {order.total_vnd / 1000} cá
                </span>
              </div>

              {IS_ADMIN_PLACEHOLDER && !cancelled && (
                <button
                  onClick={() => setCancelTarget(order)}
                  className="w-full border border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl py-2 text-sm font-medium transition"
                >
                  Huỷ đơn
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCancelTarget(null)}
          />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h2 className="font-serif text-lg font-semibold mb-2">Xác nhận huỷ đơn này?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Đơn <span className="font-mono">#{cancelTarget.id}</span> của khách{" "}
              <strong>{cancelTarget.customerName}</strong> sẽ được đánh dấu huỷ.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary/40 transition"
              >
                Đóng
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90 transition"
              >
                Huỷ đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
