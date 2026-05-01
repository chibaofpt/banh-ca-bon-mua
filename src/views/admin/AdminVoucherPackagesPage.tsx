"use client";

import { useState } from "react";
import { Coins, Gift, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/src/utils/cn";

// TODO: replace stats with real data from adminVoucherService / adminPointsService

interface VoucherPackage {
  id: string;
  name: string;
  voucher_type: "DISCOUNT" | "PRODUCT";
  points_cost: number;
  is_active: boolean;
  discount_type: "PERCENT" | "FIXED" | null;
  /** VND integer for FIXED, percentage value for PERCENT. Null for PRODUCT type. */
  discount_value: number | null;
}

type VoucherPackageForm = Omit<VoucherPackage, "id">;

const emptyForm: VoucherPackageForm = {
  name: "",
  voucher_type: "DISCOUNT",
  points_cost: 0,
  is_active: true,
  discount_type: "PERCENT",
  discount_value: null,
};

/** AdminVoucherPackagesPage — manage voucher packages and view summary stats. */
export default function AdminVoucherPackagesPage() {
  // TODO: replace with useEffect → adminVoucherService / adminPointsService
  const [totalPointsIssued, setTotalPointsIssued] = useState<number | null>(null);
  const [activeVoucherCount, setActiveVoucherCount] = useState<number | null>(null);
  const [voucherPackages, setVoucherPackages] = useState<VoucherPackage[]>([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VoucherPackageForm>(emptyForm);

  // Suppress unused-variable lint until wired
  void setTotalPointsIssued;
  void setActiveVoucherCount;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (pkg: VoucherPackage) => {
    setEditingId(pkg.id);
    const { id: _id, ...rest } = pkg;
    setForm(rest);
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      console.warn("TODO: wire toast — Vui lòng nhập tên gói");
      return;
    }
    if (editingId) {
      // TODO: wire adminVoucherService.updatePackage(editingId, form) — PUT /api/admin/voucher-packages/[id]
      setVoucherPackages((prev) =>
        prev.map((p) => (p.id === editingId ? { ...form, id: editingId } : p)),
      );
      console.warn("TODO: wire toast — Đã cập nhật gói voucher");
    } else {
      // TODO: wire adminVoucherService.createPackage(form) — POST /api/admin/voucher-packages
      setVoucherPackages((prev) => [
        ...prev,
        { ...form, id: `vp${Date.now()}` },
      ]);
      console.warn("TODO: wire toast — Đã thêm gói voucher mới");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    // TODO: wire adminVoucherService.deletePackage(id) — DELETE /api/admin/voucher-packages/[id]
    setVoucherPackages((prev) => prev.filter((p) => p.id !== id));
    console.warn("TODO: wire toast — Đã xoá gói voucher");
  };

  const toggleActive = (id: string) => {
    setVoucherPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)),
    );
    // TODO: wire adminVoucherService.updatePackage(id, { is_active }) — PUT /api/admin/voucher-packages/[id]
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Điểm &amp; Voucher</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <Coins className="text-primary mb-2" size={24} />
          <div className="text-2xl font-semibold">
            {totalPointsIssued !== null ? totalPointsIssued.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Tổng điểm đã phát</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <Gift className="text-accent mb-2" size={24} />
          <div className="text-2xl font-semibold">
            {activeVoucherCount !== null ? activeVoucherCount : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Voucher đang hoạt động</div>
        </div>
      </div>

      {/* Voucher packages */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold">Gói Voucher</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-xl hover:bg-primary/90 transition"
          >
            <Plus size={14} />
            Thêm gói
          </button>
        </div>

        {voucherPackages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Chưa có gói voucher nào.
          </p>
        )}

        <div className="space-y-2">
          {voucherPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{pkg.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {pkg.voucher_type === "DISCOUNT" ? "Giảm giá" : "Sản phẩm"} •{" "}
                  {pkg.points_cost} điểm
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Active toggle */}
                <button
                  role="switch"
                  aria-checked={pkg.is_active}
                  onClick={() => toggleActive(pkg.id)}
                  className={cn(
                    "relative inline-flex h-5 w-9 rounded-full transition",
                    pkg.is_active ? "bg-primary" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "block h-4 w-4 rounded-full bg-white shadow transition-transform m-0.5",
                      pkg.is_active ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
                <button
                  onClick={() => openEdit(pkg)}
                  className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground"
                  aria-label="Sửa"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                  aria-label="Xoá"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/edit dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl space-y-3">
            <h2 className="font-serif text-lg font-semibold">
              {editingId ? "Sửa gói voucher" : "Thêm gói voucher"}
            </h2>

            <div>
              <label className="text-sm font-medium text-foreground">Tên gói</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Giảm 10%"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Loại voucher</label>
                <select
                  value={form.voucher_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      voucher_type: e.target.value as VoucherPackage["voucher_type"],
                    })
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full mt-1"
                >
                  <option value="DISCOUNT">Giảm giá</option>
                  <option value="PRODUCT">Sản phẩm</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Chi phí (điểm)</label>
                <input
                  type="number"
                  min={0}
                  value={form.points_cost}
                  onChange={(e) =>
                    setForm({ ...form, points_cost: Number(e.target.value) })
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                />
              </div>
            </div>

            {form.voucher_type === "DISCOUNT" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Kiểu giảm</label>
                  <select
                    value={form.discount_type ?? "PERCENT"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_type: e.target.value as VoucherPackage["discount_type"],
                      })
                    }
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full mt-1"
                  >
                    <option value="PERCENT">%</option>
                    <option value="FIXED">VND</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Giá trị</label>
                  <input
                    type="number"
                    min={0}
                    value={form.discount_value ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, discount_value: Number(e.target.value) })
                    }
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-3 py-2">
              <label className="text-sm font-medium text-foreground">Đang hoạt động</label>
              <button
                role="switch"
                aria-checked={form.is_active}
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={cn(
                  "relative inline-flex h-5 w-9 rounded-full transition",
                  form.is_active ? "bg-primary" : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-white shadow transition-transform m-0.5",
                    form.is_active ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary/40 transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
              >
                {editingId ? "Lưu thay đổi" : "Thêm gói"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
