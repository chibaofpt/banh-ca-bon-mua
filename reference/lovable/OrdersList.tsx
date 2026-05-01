import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Phone, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialAdminOrders, type AdminOrder } from "@/data/admin-orders";
import { useToast } from "@/hooks/use-toast";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const OrdersList = () => {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [orders, setOrders] = useState<AdminOrder[]>(
    [...initialAdminOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);

  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const confirmCancel = () => {
    if (!cancelTarget) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: "CANCELLED" } : o)),
    );
    toast({ title: "Đã huỷ đơn", description: `${cancelTarget.id} đã được huỷ.` });
    setCancelTarget(null);
  };

  return (
    <AdminShell>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-xl font-semibold text-foreground">Đơn hàng</h1>
          <span className="text-xs text-muted-foreground">{orders.length} đơn</span>
        </div>

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
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 border-0 text-[11px]",
                      cancelled
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {cancelled ? "CANCELLED" : "COMPLETED"}
                  </Badge>
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
                  <span className="font-semibold text-foreground">🐟 {order.total} cá</span>
                </div>

                {isAdmin && !cancelled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setCancelTarget(order)}
                  >
                    Huỷ đơn
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận huỷ đơn này?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn {cancelTarget?.id} của khách {cancelTarget?.customerName} sẽ được đánh dấu huỷ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Huỷ đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
};

export default OrdersList;
