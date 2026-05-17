"use client";

import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/src/utils/cn";
import type { AdminMenuItem } from "@/src/lib/types/menu";

interface MenuItemCardProps {
  item: AdminMenuItem;
  onClick: (item: AdminMenuItem) => void;
  onToggleAvailable: (id: string, next: boolean) => void;
}

/** Card hiển thị 1 menu item trong trang admin. */
export default function MenuItemCard({
  item,
  onClick,
  onToggleAvailable,
}: MenuItemCardProps) {
  // Price range — min price among sizes that have a non-null base_price_vnd
  const activeSizes = item.sizes.filter((s) => s.base_price_vnd != null);
  const minPriceCa =
    activeSizes.length > 0
      ? Math.min(...activeSizes.map((s) => Math.floor(s.base_price_vnd! / 1000)))
      : null;

  return (
    <div
      onClick={() => onClick(item)}
      className={cn(
        "relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition hover:shadow-md cursor-pointer hover:border-primary/30",
        !item.is_available && "opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative h-36 bg-secondary/30 flex items-center justify-center">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <span className="text-4xl select-none">🍵</span>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              item.category === "latte"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-violet-100 text-violet-700"
            )}
          >
            {item.category}
          </span>
          {item.is_seasonal && (
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Mùa vụ
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        <p className="text-sm font-semibold text-foreground line-clamp-2">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-auto pt-1">
          {minPriceCa != null ? (
            <>
              🐟{" "}
              <span className="font-medium text-foreground">
                {minPriceCa}+
              </span>{" "}
              cá
            </>
          ) : (
            <span className="italic">Chưa có giá</span>
          )}
        </p>
      </div>

      {/* Footer — toggle only */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Trạng thái</span>
        {/* Availability toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={item.is_available}
          aria-label={item.is_available ? "Đang bán — bấm để tạm ẩn" : "Đang ẩn — bấm để mở bán"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAvailable(item.id, !item.is_available);
          }}
          className={cn(
            "relative inline-flex h-5 w-9 rounded-full transition",
            item.is_available ? "bg-primary" : "bg-border"
          )}
        >
          <span
            className={cn(
              "block h-4 w-4 rounded-full bg-white shadow transition-transform m-0.5",
              item.is_available ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>
    </div>
  );
}
