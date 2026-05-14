"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/src/utils/cn";
import type { MenuItem, SweetnessLevel, AddonGroup } from "@/src/lib/types/menu";
import type { CartItem } from "@/src/lib/types/cart";

// ── Constants ────────────────────────────────────────────────────────────────

const SWEETNESS_LEVELS: SweetnessLevel[] = ["NONE", "QUARTER", "HALF", "THREE_QUARTER", "FULL"];
const SWEETNESS_LABELS: Record<SweetnessLevel, string> = {
  NONE: "Lạt",
  QUARTER: "Ít ngọt",
  HALF: "Vừa",
  THREE_QUARTER: "Ngọt",
  FULL: "Rất ngọt",
};

// ── Props ────────────────────────────────────────────────────────────────────

interface AddonModalProps {
  item: MenuItem | null;
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
  // Use optional chaining and default values to prevent crashes when item is null
  const [selectedSize, setSelectedSize] = useState<"M" | "L" | "XL" | null>(
    item?.category === "daily" ? "L" : null
  );
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() =>
    item ? initSelectedOptionIds(item) : []
  );
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>(() =>
    item ? initQuantityMap(item) : {}
  );
  const [sweetness, setSweetness] = useState<SweetnessLevel>("QUARTER");
  const [note, setNote] = useState("");

  // ── Price ───────────────────────────────────────────────────────────────

  const calcUnitPrice = (): number => {
    if (!item) return 0;
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

  // ── Validation ───────────────────────────────────────────────────────────

  const isConfirmDisabled = (): boolean => {
    if (!item) return true;
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
    if (!item) return;
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
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[61] max-h-[92vh] overflow-y-auto rounded-t-3xl bg-background border-t border-border shadow-2xl"
          >
            <div className="px-5 pb-32 pt-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pt-3 pb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    {item.name}
                  </h2>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}
                  {freeVoucherId && (
                    <span className="inline-block mt-2 text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                      🎁 Miễn phí
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 w-9 h-9 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Size picker — daily only */}
              {item.category === "daily" && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Chọn Size *
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {item.sizes.map((s) => (
                      <button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        className={cn(
                          "rounded-xl border-2 py-3 px-2 text-center transition-all",
                          selectedSize === s.size
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        <span className="block font-semibold text-sm text-foreground">
                          {s.size}
                        </span>
                        <span className="block text-xs font-semibold text-primary mt-1">
                          🐟 {s.price_vnd / 1000} cá
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sweetness */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Độ Ngọt
                  </h3>
                  <span className="text-sm font-semibold text-primary">
                    {SWEETNESS_LABELS[sweetness]}
                  </span>
                </div>
                {(() => {
                  const activeIdx = SWEETNESS_LEVELS.indexOf(sweetness);
                  return (
                    <div className="px-2.5">
                      <div className="relative h-5 flex items-center">
                        <input
                          type="range"
                          min={0}
                          max={4}
                          step={1}
                          value={SWEETNESS_LEVELS.indexOf(sweetness)}
                          onChange={(e) =>
                            setSweetness(SWEETNESS_LEVELS[Number(e.target.value)])
                          }
                          className="w-full accent-primary"
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-0">
                          {SWEETNESS_LEVELS.map((s, i) => {
                            const filled = i <= activeIdx;
                            const isActive = i === activeIdx;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSweetness(s)}
                                style={{ left: `${(i / 4) * 100}%` }}
                                className="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
                              >
                                <span
                                  className={cn(
                                    "block w-2 h-2 rounded-full transition-all",
                                    filled
                                      ? "bg-primary-foreground/80"
                                      : "bg-muted-foreground/40",
                                    isActive && "opacity-0"
                                  )}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="relative h-5 mt-2">
                        {SWEETNESS_LEVELS.map((s, i) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSweetness(s)}
                            style={{ left: `${(i / 4) * 100}%` }}
                            className={cn(
                              "absolute top-0 -translate-x-1/2 text-[10px] whitespace-nowrap transition-colors",
                              sweetness === s
                                ? "text-primary font-semibold"
                                : "text-muted-foreground"
                            )}
                          >
                            {SWEETNESS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Addon groups */}
              {item.addon_groups.map((group) => {
                if (group.type === "QUANTITY") {
                  return (
                    <div key={group.id} className="mb-5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        {group.name}
                      </h3>
                      <div className="flex gap-2">
                        {Array.from(
                          { length: (group.max_quantity ?? 3) + 1 },
                          (_, i) => i
                        ).map((v) => (
                          <button
                            key={v}
                            onClick={() =>
                              setQuantityMap((prev) => ({ ...prev, [group.id]: v }))
                            }
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-all",
                              (quantityMap[group.id] ?? 0) === v
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-secondary/60 text-foreground/70 hover:bg-secondary"
                            )}
                          >
                            {v === 0 ? "Không" : `+${v}g`}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (group.type === "SELECTOR") {
                  return (
                    <div key={group.id} className="mb-5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        {group.name}{group.is_required ? " *" : ""}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {group.options.map((opt) => {
                          const checked = selectedOptionIds.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleSelectorChange(group, opt.id)}
                              className={cn(
                                "rounded-xl border-2 py-2.5 px-3 text-center transition-all",
                                checked
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-background hover:border-primary/30"
                              )}
                            >
                              <span className="block font-semibold text-sm text-foreground">
                                {opt.label}
                              </span>
                              <span className="block text-[11px] font-semibold text-primary mt-0.5">
                                {opt.price_vnd > 0
                                  ? `+${opt.price_vnd / 1000} 🐟`
                                  : "Miễn phí"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // TOGGLE
                return (
                  <div key={group.id} className="mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {group.name}
                    </h3>
                    <div className="space-y-2">
                      {group.options.map((opt) => {
                        const checked = selectedOptionIds.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleToggleChange(opt.id)}
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                              checked
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:border-primary/30"
                            )}
                          >
                            <span className="font-semibold text-sm text-foreground">
                              {opt.label}
                            </span>
                            {opt.price_vnd > 0 && (
                              <span className="text-sm font-semibold text-primary whitespace-nowrap ml-3">
                                +{opt.price_vnd / 1000} 🐟
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Note */}
              <div className="mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Ghi chú
                </h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: ít đá, không đường..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px] resize-none"
                />
              </div>
            </div>

            {/* Sticky bottom bar */}
            <div className="fixed bottom-0 inset-x-0 z-[62] bg-background border-t border-border px-5 py-4">
              <button
                onClick={handleConfirm}
                disabled={isConfirmDisabled()}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold text-sm shadow-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                {freeVoucherId
                  ? "Thêm vào giỏ • 🎁 Miễn phí"
                  : `Thêm vào giỏ 🐟 → 🐟 ${unitPrice / 1000} cá`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
