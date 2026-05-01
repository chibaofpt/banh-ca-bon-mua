import AdminShell from "@/components/admin/AdminShell";
import { Gift, Coins } from "lucide-react";

const AdminRewards = () => (
  <AdminShell>
    <div className="px-4 py-4 space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Điểm & Voucher</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <Coins className="text-primary mb-2" size={24} />
          <div className="text-2xl font-semibold">12,450</div>
          <div className="text-xs text-muted-foreground">Tổng điểm đã phát</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <Gift className="text-accent mb-2" size={24} />
          <div className="text-2xl font-semibold">87</div>
          <div className="text-xs text-muted-foreground">Voucher đang hoạt động</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-serif text-lg font-semibold mb-3">Voucher đang phát hành</h2>
        <div className="space-y-2">
          {[
            { name: "Giảm 10%", type: "Discount", count: 42 },
            { name: "Free Bánh Cá Matcha", type: "Product", count: 18 },
            { name: "Mua 1 Tặng 1 Hojicha", type: "Discount", count: 27 },
          ].map((v) => (
            <div key={v.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
              <div>
                <div className="font-medium text-sm">{v.name}</div>
                <div className="text-[11px] text-muted-foreground">{v.type}</div>
              </div>
              <div className="text-sm text-primary font-semibold">{v.count} lượt</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </AdminShell>
);

export default AdminRewards;
