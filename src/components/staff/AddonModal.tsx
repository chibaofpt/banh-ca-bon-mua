"use client";

import { useState } from "react";
import { cn } from "@/src/utils/cn";
import type { MenuItem, SweetnessLevel, AddonGroup } from "@/src/lib/types/menu";
import type { CartItem } from "@/src/lib/types/cart";

// ── Constants ────────────────────────────────────────────────────────────────

const SWEETNESS_OPTIONS: { label: string; value: SweetnessLevel }[] = [
  { label: "Lạt", value: "NONE" },
  { label: "Ít ngọt", value: "QUARTER" },
  { label: "Vừa", value: "HALF" },
  { label: "Ngọt", value: "THREE_QUARTER" },
  { label: "Rất ngọt", value: "FULL" },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface AddonModalProps {
  item: MenuItem;
  /** If set, the unit price of this item will be forced to 0 (PRODUCT voucher free item). */
  freeVoucherId?: string;
  onClose: () => void;
  onConfirm: (cartItem: CartItem) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Derive the initial selected option ids from group defaults. */
function initSelectedOptionIds(item: MenuItem): string[] {
  return item.addon_groups.flatMap((g) =>
    g.options.filter((o) => o.is_default).map((o) => o.id)
  );
}

/** Derive the initial quantity map for QUANTITY groups (all zero). */
function initQuantityMap(item: MenuItem): Record<string, number> {
  return Object.fromEntries(
    item.addon_groups
      .filter((g) => g.type === "QUANTITY")
      .map((g) => [g.id, 0])
  );
}

// ── Component ────────────────────────────────────────────────────────────────

/** Modal for customising a menu item before adding to the staff counter cart. */
export function AddonModal({ item, freeVoucherId, onClose, onConfirm }: AddonModalProps) {
  const [selectedSize, setSelectedSize] = useState<"M" | "L" | "XL" | null>(
    item.category === "daily" ? "L" : null
  );
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() =>
    initSelectedOptionIds(item)
  );
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>(() =>
    initQuantityMap(item)
  );
  const [sweetness, setSweetness] = useState<SweetnessLevel>("QUARTER");
  const [note, setNote] = useState("");

  // ── Price ───────────────────────────────────────────────────────────────

  const calcUnitPrice = (): number => {
    if (freeVoucherId) return 0;

    const base =
      item.category === "daily"
        ? (item.sizes.find((s) => s.size === selectedSize)?.price_vnd ?? 0)
        : (item.price_vnd ?? 0);

    const addonsCost = item.addon_groups
      .flatMap((g) => {
        if (g.type === "QUANTITY") {
          const qty = quantityMap[g.id] ?? 0;
          return qty > 0 ? [qty * (g.options[0]?.price_vnd ?? 0)] : [];
        }
        return g.options
          .filter((o) => selectedOptionIds.includes(o.id))
          .map((o) => o.price_vnd);
      })
      .reduce((s, v) => s + v, 0);

    return base + addonsCost;
  };

  // ── Addon toggle helpers ─────────────────────────────────────────────────

  const handleSelectorChange = (group: AddonGroup, optionId: string) => {
    const groupOptionIds = group.options.map((o) => o.id);
    setSelectedOptionIds((prev) => [
      ...prev.filter((id) => !groupOptionIds.includes(id)),
      optionId,
    ]);
  };

  const handleToggleChange = (optionId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleQuantityChange = (groupId: string, delta: number, max: number) => {
    setQuantityMap((prev) => {
      const current = prev[groupId] ?? 0;
      return { ...prev, [groupId]: Math.min(max, Math.max(0, current + delta)) };
    });
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const isConfirmDisabled = (): boolean => {
    if (item.category === "daily" && selectedSize === null) return true;
    for (const g of item.addon_groups) {
      if (
        g.type === "SELECTOR" &&
        g.is_required &&
        !g.options.some((o) => selectedOptionIds.includes(o.id))
      ) {
        return true;
      }
    }
    return false;
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    const unitPrice = calcUnitPrice();
    const basePrice =
      item.category === "daily"
        ? (item.sizes.find((s) => s.size === selectedSize)?.price_vnd ?? 0)
        : (item.price_vnd ?? 0);
    const addonsPrice = freeVoucherId ? 0 : unitPrice - basePrice;

    const quantityAddonOptions = item.addon_groups
      .filter((g) => g.type === "QUANTITY")
      .flatMap((g) => {
        const qty = quantityMap[g.id] ?? 0;
        return qty > 0 && g.options[0]
          ? [{ option_id: g.options[0].id, quantity: qty }]
          : [];
      });

    const cartItem: CartItem = {
      cartId: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      imageUrl: item.image_url,
      size: selectedSize,
      unitPrice,
      quantity: 1,
      sweetness,
      note,
      selectedOptionIds,
      quantityMap,
      addonsPrice,
      quantityAddonOptions,
      ...(freeVoucherId ? { productVoucherId: freeVoucherId } : {}),
    };

    onConfirm(cartItem);
  };

  const unitPrice = calcUnitPrice();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div>
          <h2 className="font-serif text-xl font-semibold">{item.name}</h2>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
          )}
          {freeVoucherId && (
            <span className="inline-block mt-1 text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
              🎁 Miễn phí
            </span>
          )}
        </div>

        {/* Size picker — daily only */}
        {item.category === "daily" && (
          <div>
            <label className="text-sm font-medium text-foreground">Kích cỡ *</label>
            <div className="flex gap-2 mt-1.5">
              {item.sizes.map((s) => (
                <button
                  key={s.size}
                  onClick={() => setSelectedSize(s.size)}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5 text-sm font-medium transition",
                    selectedSize === s.size
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-secondary/40"
                  )}
                >
                  {s.size}
                  <div className="text-[11px] font-normal opacity-70 mt-0.5">
                    🐟 {s.price_vnd / 1000}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Addon groups */}
        {item.addon_groups.map((group) => {
          if (group.type === "QUANTITY") {
            const qty = quantityMap[group.id] ?? 0;
            const max = group.max_quantity ?? 99;
            return (
              <div key={group.id}>
                <label className="text-sm font-medium text-foreground">{group.name}</label>
                <div className="flex items-center justify-between mt-1.5 px-3 py-2 rounded-xl border border-border bg-card">
                  <span className="text-sm">Thêm</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(group.id, -1, max)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-secondary/40 transition"
                      aria-label="Giảm"
                    >
                      −
                    </button>
                    <span className="font-medium w-8 text-center text-sm">
                      {qty}g
                    </span>
                    <button
                      onClick={() => handleQuantityChange(group.id, 1, max)}
                      disabled={qty >= max}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-secondary/40 transition"
                      aria-label="Tăng"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // SELECTOR / TOGGLE
          return (
            <div key={group.id}>
              <label className="text-sm font-medium text-foreground">
                {group.name}{group.type === "SELECTOR" && group.is_required ? " *" : ""}
              </label>
              <div className="space-y-1.5 mt-1.5">
                {group.options.map((opt) => {
                  const checked = selectedOptionIds.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition",
                        checked
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border hover:bg-secondary/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type={group.type === "SELECTOR" ? "radio" : "checkbox"}
                          name={`addon-group-${group.id}`}
                          checked={checked}
                          onChange={() =>
                            group.type === "SELECTOR"
                              ? handleSelectorChange(group, opt.id)
                              : handleToggleChange(opt.id)
                          }
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      {opt.price_vnd > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +{opt.price_vnd / 1000} cá
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Sweetness */}
        <div>
          <label className="text-sm font-medium text-foreground">Mức ngọt</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {SWEETNESS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSweetness(s.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition",
                  sweetness === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-secondary/40"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-sm font-medium text-foreground">Ghi chú</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: ít đá, không đường..."
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px] resize-none mt-1.5"
          />
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={isConfirmDisabled()}
          className="w-full bg-primary text-primary-foreground rounded-xl h-11 font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {freeVoucherId
            ? "Thêm vào giỏ • 🎁 Miễn phí"
            : `Thêm vào giỏ • 🐟 ${unitPrice / 1000} cá`}
        </button>
      </div>
    </div>
  );
}
