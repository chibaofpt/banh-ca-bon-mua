"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/src/utils/cn";
import {
  listAdminMenuItems,
  createMenuItem,
} from "@/src/services/adminMenuService";
import type { AdminMenuItem } from "@/src/lib/types/menu";
import AddMenuItemModal from "@/src/components/admin/AddMenuItemModal";

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

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false); // Placeholder for edit flow
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = [
    "Tất cả",
    ...Array.from(new Set(items.map((i) => i.category))).sort(),
  ];

  const visibleItems =
    activeCategory === "Tất cả"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const openAdd = () => {
    setAddModalOpen(true);
  };

  const openEdit = (item: AdminMenuItem) => {
    setEditingId(item.id);
    // TODO: wire edit modal when implemented
    setOpenEditModal(true);
    console.warn("TODO: implement edit flow using separate component");
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
                  {item.price_vnd !== null
                    ? `🐟 ${item.price_vnd / 1000} cá`
                    : "Xem giá theo size"}
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

      {addModalOpen && (
        <AddMenuItemModal
          onClose={() => setAddModalOpen(false)}
          onCreated={(item) => setItems((prev) => [item, ...prev])}
          onSubmit={createMenuItem}
        />
      )}
    </div>
  );
}
