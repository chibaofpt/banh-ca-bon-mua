"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/src/utils/cn";
import {
  listAdminMenuItems,
  type AdminMenuItem,
} from "@/src/services/adminMenuService";

type AdminMenuItemForm = Omit<AdminMenuItem, "id" | "sort_order" | "created_at">;

const emptyForm: AdminMenuItemForm = {
  name: "",
  category: "",
  price_vnd: 0,
  description: "",
  image_url: null,
  is_available: true,
};

/** AdminMenuPage — list and manage menu items with image upload, CRUD dialogs. */
export default function AdminMenuPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  useEffect(() => {
    listAdminMenuItems()
      .then(setItems)
      .catch(() => setError("Không thể tải danh sách món"))
      .finally(() => setLoading(false));
  }, []);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminMenuItemForm>(emptyForm);
  // TODO: wire file upload → POST /api/admin/menu (multipart/form-data)
  const [_imageFile, setImageFile] = useState<File | null>(null);

  const categories = [
    "Tất cả",
    ...Array.from(new Set(items.map((i) => i.category))).sort(),
  ];

  const visibleItems =
    activeCategory === "Tất cả"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setOpen(true);
  };

  const openEdit = (item: AdminMenuItem) => {
    setEditingId(item.id);
    const { id: _id, sort_order: _so, created_at: _ca, ...rest } = item;
    setForm(rest);
    setImageFile(null);
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      console.warn("TODO: wire toast — Vui lòng nhập tên món");
      return;
    }
    if (editingId) {
      // TODO: wire adminMenuService.updateItem(editingId, formData) — PUT /api/admin/menu/[id]
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingId
            ? { ...i, ...form }
            : i,
        ),
      );
      console.warn("TODO: wire toast — Đã cập nhật món");
    } else {
      // TODO: wire adminMenuService.createItem(formData) — POST /api/admin/menu
      const newItem: AdminMenuItem = {
        ...form,
        id: `m${Date.now()}`,
        sort_order: items.length,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      console.warn("TODO: wire toast — Đã thêm món mới");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    // Soft delete only: set is_available = false — PUT /api/admin/menu/[id]
    // TODO: wire adminMenuService.updateItem(id, { is_available: false })
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: false } : i)),
    );
    console.warn("TODO: wire toast — Đã ẩn món (soft delete)");
  };

  const toggleAvailable = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const next = !target.is_available;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: next } : i)),
    );
    // TODO: wire adminMenuService.updateItem(id, { is_available: next }) — PUT /api/admin/menu/[id]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-destructive text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Sản phẩm</h1>
          <p className="text-xs text-muted-foreground">{items.length} món trong menu</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-xl hover:bg-primary/90 transition"
        >
          <Plus size={16} />
          Thêm món
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs border transition",
              activeCategory === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/40 text-foreground border-border",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Chưa có món nào
        </div>
      )}

      <div className="space-y-3">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="bg-card rounded-2xl border border-border p-3 flex gap-3 items-center shadow-sm"
          >
            {/* Image / placeholder */}
            <div className="w-16 h-16 rounded-xl bg-secondary/40 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span>🍵</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{item.category}</p>
                </div>
                <div className="text-primary font-semibold text-sm whitespace-nowrap">
                  🐟 {item.price_vnd / 1000} cá
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <button
                    role="switch"
                    aria-checked={item.is_available}
                    onClick={() => toggleAvailable(item.id)}
                    className={cn(
                      "relative inline-flex h-5 w-9 rounded-full transition",
                      item.is_available ? "bg-primary" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "block h-4 w-4 rounded-full bg-white shadow transition-transform m-0.5",
                        item.is_available ? "translate-x-4" : "translate-x-0",
                      )}
                    />
                  </button>
                  <span
                    className={item.is_available ? "text-primary" : "text-muted-foreground"}
                  >
                    {item.is_available ? "Đang bán" : "Tạm hết"}
                  </span>
                </label>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-lg hover:bg-secondary/40 text-muted-foreground"
                    aria-label="Sửa"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                    aria-label="Xoá"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[85vh] overflow-y-auto space-y-3">
            <h2 className="font-serif text-lg font-semibold">
              {editingId ? "Sửa món" : "Thêm món mới"}
            </h2>

            <div>
              <label className="text-sm font-medium text-foreground">Tên món</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Matcha Latte"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Danh mục</label>
                {categories.length > 0 ? (
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full mt-1"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Ví dụ: Daily"
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Giá (cá 🐟)</label>
                <input
                  type="number"
                  min={0}
                  value={form.price_vnd / 1000}
                  onChange={(e) =>
                    setForm({ ...form, price_vnd: Number(e.target.value) * 1000 })
                  }
                  placeholder="0"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Mô tả</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về món"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px] resize-none mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Ảnh sản phẩm
              </label>
              {/* TODO: wire file upload → POST /api/admin/menu (multipart/form-data) */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-secondary/40 file:text-sm file:font-medium hover:file:bg-secondary/60"
              />
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Ảnh hiện tại"
                  className="mt-2 h-20 w-20 rounded-xl object-cover border border-border"
                />
              )}
            </div>

            <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-3 py-2">
              <label className="text-sm font-medium text-foreground">Trạng thái bán</label>
              <button
                role="switch"
                aria-checked={form.is_available}
                onClick={() => setForm({ ...form, is_available: !form.is_available })}
                className={cn(
                  "relative inline-flex h-5 w-9 rounded-full transition",
                  form.is_available ? "bg-primary" : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-white shadow transition-transform m-0.5",
                    form.is_available ? "translate-x-4" : "translate-x-0",
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
                {editingId ? "Lưu thay đổi" : "Thêm món"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
