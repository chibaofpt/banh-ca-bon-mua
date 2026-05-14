"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import type { MenuItem, AddonGroup, SweetnessLevel, Size } from "@/src/lib/types/menu";
import type { IceOption, CartItem } from "@/src/lib/types/cart";
import { usePowderStore } from "@/src/lib/store/powderStore";
import { cn } from "@/src/utils/cn";
import { calcLattePrice, calcFusionPrice, resolveGram } from "@/src/utils/pricing";
import { SWEETNESS_OPTIONS, ICE_OPTIONS, SIZE_LABELS } from "@/src/constants/orderOptions";

interface AddonModalProps {
  item: MenuItem | null;
  latteItems: MenuItem[];
  freeVoucherId?: string;
  onClose: () => void;
  onConfirm: (cartItem: CartItem) => void;
}

export function AddonModal({ item, latteItems, freeVoucherId, onClose, onConfirm }: AddonModalProps) {
  const powders = usePowderStore((s) => s.data);
  const defaultPowderGrams = usePowderStore((s) => s.defaultPowderGram);

  // ── State ───────────────────────────────────────────────────────────────

  const [selectedSize, setSelectedSize] = useState<Size>(() => {
    const available = item?.sizes ?? [];
    return (available.find((s) => s.size === "L") ?? available[0])?.size ?? "M";
  });
  const [sweetness, setSweetness] = useState<SweetnessLevel>("QUARTER");
  const [iceOption, setIceOption] = useState<IceOption>("NORMAL");
  const [coldwhisk, setColdwhisk] = useState(false);
  const [selectedPowderId, setSelectedPowderId] = useState<string>(item?.resolved_default_powder_id ?? "");
  const [selectedMilkId, setSelectedMilkId] = useState<string>(() => {
    return item?.milk_types?.find(m => m.is_default)?.id ?? item?.milk_types?.[0]?.id ?? "";
  });

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() =>
    item?.addon_groups.flatMap((g) =>
      g.options.filter((o) => o.is_default).map((o) => o.id)
    ) ?? []
  );
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>(() =>
    item ? Object.fromEntries(
      item.addon_groups
        .filter((g) => g.type === "QUANTITY")
        .map((g) => [g.id, 0])
    ) : {}
  );
  const [note, setNote] = useState("");

  if (!item) return null;

  // ── Derived state ────────────────────────────────────────────────────────
  
  const isLatte = item.category === "latte";
  const activePowderId = isLatte ? (item.powder?.id ?? "") : selectedPowderId;
  const activePowder = powders.find((p) => p.id === activePowderId);
  const activePowderPricePerGram = activePowder?.price_per_gram ?? 0;

  const quantityGroups = useMemo(
    () => item.addon_groups.filter((g) => g.type === "QUANTITY"),
    [item.addon_groups]
  );

  const selectorGroups = useMemo(
    () => item.addon_groups.filter((g) => g.type === "SELECTOR"),
    [item.addon_groups]
  );

  const toggleGroups = useMemo(
    () => item.addon_groups.filter((g) => g.type === "TOGGLE"),
    [item.addon_groups]
  );

  // ── Pricing ──────────────────────────────────────────────────────────────

  const getPriceForContext = (targetSize: Size, targetPowderId: string) => {
    const sizeObj = item.sizes.find((s) => s.size === targetSize);
    const base_price_vnd = sizeObj?.base_price_vnd ?? 0;

    const pwd = powders.find((p) => p.id === targetPowderId);
    const pwd_price_per_gram = pwd?.price_per_gram ?? 0;

    const gram = resolveGram(
      targetSize,
      item.custom_powder_grams,
      pwd?.size_config ?? [],
      defaultPowderGrams
    );

    let baseDrinkPrice = 0;

    if (isLatte) {
      const milk_ml = sizeObj?.milk_ml ?? 0;
      const milk = item.milk_types?.find((m) => m.id === selectedMilkId);
      const milk_price_per_ml = milk?.price_per_ml ?? 40;

      baseDrinkPrice = calcLattePrice({
        base_price_vnd,
        gram,
        powder_price_per_gram: pwd_price_per_gram,
        milk_ml,
        milk_price_per_ml,
      });
    } else {
      let premium_latte = 0;
      const defaultPowder = powders.find((p) => p.id === item.resolved_default_powder_id);
      if (pwd?.reference_latte_item_id && defaultPowder?.reference_latte_item_id) {
        const selectedLatteBase = latteItems.find((i) => i.id === pwd.reference_latte_item_id)?.sizes.find((s) => s.size === targetSize)?.base_price_vnd ?? 0;
        const defaultLatteBase = latteItems.find((i) => i.id === defaultPowder.reference_latte_item_id)?.sizes.find((s) => s.size === targetSize)?.base_price_vnd ?? 0;
        premium_latte = selectedLatteBase - defaultLatteBase;
      }

      baseDrinkPrice = calcFusionPrice({
        base_price_vnd,
        gram,
        powder_price_per_gram: pwd_price_per_gram,
        premium_latte,
      });
    }

    let addonsCost = 0;
    for (const g of item.addon_groups) {
      if (g.type === "QUANTITY") {
        const qty = quantityMap[g.id] ?? 0;
        const opt = g.options[0];
        if (qty > 0 && opt) {
          if (opt.gram_value != null) {
            addonsCost += qty * (opt.gram_value * pwd_price_per_gram);
          } else {
            addonsCost += qty * opt.price_vnd;
          }
        }
      } else {
        for (const opt of g.options) {
          if (selectedOptionIds.includes(opt.id)) {
            addonsCost += opt.price_vnd;
          }
        }
      }
    }

    return { baseDrinkPrice, addonsCost, unitPrice: baseDrinkPrice + addonsCost };
  };

  const currentPriceContext = getPriceForContext(selectedSize, activePowderId);
  const currentBasePowderPriceContext = getPriceForContext(selectedSize, item.resolved_default_powder_id ?? "");

  // If free voucher is used, final prices are 0. We still use currentPriceContext for UI display, 
  // but override unitPrice / addonsCost for the CartItem payload.
  const finalUnitPrice = freeVoucherId ? 0 : currentPriceContext.unitPrice;
  const finalAddonsCost = freeVoucherId ? 0 : currentPriceContext.addonsCost;

  // ── Validation ───────────────────────────────────────────────────────────

  const isConfirmDisabled = (): boolean => {
    if (!selectedSize) return true;
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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectorChange = (group: AddonGroup, optionId: string) => {
    const defaultOpt = group.options.find(o => o.is_default);
    const groupOptionIds = group.options.map((o) => o.id);

    setSelectedOptionIds((prev) => {
      if (prev.includes(optionId)) {
        // Toggle off -> return to default option if exists
        const next = prev.filter((id) => id !== optionId);
        if (defaultOpt) next.push(defaultOpt.id);
        return next;
      }
      return [...prev.filter((id) => !groupOptionIds.includes(id)), optionId];
    });
  };

  const handleToggleChange = (optionId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleConfirm = () => {
    const quantityAddonOptions = item.addon_groups
      .filter((g) => g.type === "QUANTITY")
      .flatMap((g) => {
        const qty = quantityMap[g.id] ?? 0;
        return qty > 0 && g.options[0]
          ? [{ option_id: g.options[0].id, quantity: qty }]
          : [];
      });

    onConfirm({
      cartId: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      imageUrl: item.image_url,
      size: selectedSize,
      unitPrice: finalUnitPrice,
      quantity: 1,
      sweetness,
      iceOption,
      coldwhisk,
      note,
      selectedOptionIds,
      quantityMap,
      addonsPrice: finalAddonsCost,
      quantityAddonOptions,
      selectedPowderId: isLatte ? undefined : selectedPowderId,
      selectedMilkTypeId: isLatte ? selectedMilkId : undefined,
      clientPriceVnd: finalUnitPrice,
      ...(freeVoucherId ? { productVoucherId: freeVoucherId } : {}),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="addon-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="addon-content"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[61] max-h-[92vh] overflow-y-auto rounded-t-3xl bg-background border-t border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center transition-transform hover:bg-secondary z-10"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="px-5 pb-32 pt-2">
          {/* Header */}
          <div className="pt-3 pb-4 border-b border-border/40">
            <h2 className="font-serif text-2xl font-bold text-foreground">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
            )}
            {freeVoucherId && (
              <span className="inline-block mt-2 text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                🎁 Miễn phí
              </span>
            )}
          </div>

          {/* Size Selector */}
          {item.sizes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Chọn Size *
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {item.sizes.map((s) => {
                  const sizePrice = getPriceForContext(s.size, activePowderId).unitPrice;
                  return (
                    <button
                      key={s.size}
                      onClick={() => setSelectedSize(s.size)}
                      className={cn(
                        "rounded-xl border-2 py-3 px-2 text-center transition-all flex flex-col items-center justify-center gap-1",
                        selectedSize === s.size
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-border bg-background hover:border-primary/30"
                      )}
                    >
                      <span className="block font-semibold text-sm text-foreground">
                        {SIZE_LABELS[s.size]}
                      </span>
                      <p className="text-[11px] font-semibold text-primary mt-1">
                        🐟 {sizePrice / 1000} cá
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sweetness Slider */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Độ Ngọt
              </h3>
              <span className="text-sm font-semibold text-primary">
                {SWEETNESS_OPTIONS.find((o) => o.value === sweetness)?.label}
              </span>
            </div>
            {(() => {
              const activeIdx = SWEETNESS_OPTIONS.findIndex((o) => o.value === sweetness);
              return (
                <div className="px-3">
                  <div className="relative h-5 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={SWEETNESS_OPTIONS.length - 1}
                      step={1}
                      value={activeIdx}
                      onChange={(e) =>
                        setSweetness(SWEETNESS_OPTIONS[Number(e.target.value)].value)
                      }
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-0">
                      {SWEETNESS_OPTIONS.map((opt, i) => {
                        const filled = i <= activeIdx;
                        const isActive = i === activeIdx;
                        return (
                          <div
                            key={opt.value}
                            style={{ left: `${(i / (SWEETNESS_OPTIONS.length - 1)) * 100}%` }}
                            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
                          >
                            <span
                              className={cn(
                                "block w-2.5 h-2.5 rounded-full transition-all border",
                                filled
                                  ? "bg-primary border-primary"
                                  : "bg-background border-border",
                                isActive && "scale-150 shadow-sm"
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative h-5 mt-3">
                    {SWEETNESS_OPTIONS.map((opt, i) => (
                      <div
                        key={opt.value}
                        style={{ left: `${(i / (SWEETNESS_OPTIONS.length - 1)) * 100}%` }}
                        className={cn(
                          "absolute top-0 -translate-x-1/2 text-[10px] whitespace-nowrap transition-colors",
                          sweetness === opt.value
                            ? "text-primary font-semibold"
                            : "text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Ice Option */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Lượng Đá
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
              {ICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIceOption(iceOption === opt.value ? "NORMAL" : opt.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                    iceOption === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-foreground border-transparent hover:bg-secondary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coldwhisk */}
          <div className="mt-6 flex items-center justify-between border border-border bg-card p-3 rounded-xl shadow-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Đánh Lạnh (Coldwhisk)
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Lớp foam matcha mịn màng</p>
            </div>
            <button
              onClick={() => setColdwhisk(!coldwhisk)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                coldwhisk ? "bg-primary" : "bg-secondary"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                  coldwhisk ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Powder Swap (Fusion) */}
          {!isLatte && item.allowed_powder_ids.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Đổi bột Matcha
              </h3>
              <div className="flex flex-col gap-2">
                {[item.resolved_default_powder_id!, ...item.allowed_powder_ids.filter(id => id !== item.resolved_default_powder_id)].map((pid) => {
                  const pwd = powders.find((p) => p.id === pid);
                  if (!pwd) return null;
                  
                  const priceContext = getPriceForContext(selectedSize, pid);
                  const diff = priceContext.unitPrice - currentBasePowderPriceContext.unitPrice;

                  return (
                    <button
                      key={pid}
                      onClick={() => setSelectedPowderId(pid)}
                      className={cn(
                        "rounded-xl border-2 py-2 px-3 text-left transition-all flex items-center justify-between",
                        selectedPowderId === pid
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/30"
                      )}
                    >
                      <div>
                        <span className="block font-semibold text-sm text-foreground">{pwd.name}</span>
                        <span className="block text-[11px] text-muted-foreground mt-1">
                          {pwd.price_per_gram / 1000}k / gram
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block font-semibold text-sm text-foreground">
                          {priceContext.unitPrice / 1000}k
                        </span>
                        {diff !== 0 && (
                          <span className={cn(
                            "block text-[10px] font-semibold mt-0.5",
                            diff > 0 ? "text-red-500" : "text-green-600"
                          )}>
                            {diff > 0 ? "+" : ""}{diff / 1000}k
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Milk Swap (Latte) */}
          {isLatte && item.milk_types.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Đổi loại sữa
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
                {item.milk_types.map((milk) => (
                  <button
                    key={milk.id}
                    onClick={() => setSelectedMilkId(milk.id)}
                    className={cn(
                      "flex-shrink-0 flex flex-col items-center rounded-xl border-2 px-4 py-2 text-center transition-all",
                      selectedMilkId === milk.id
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border bg-background hover:border-primary/30"
                    )}
                  >
                    <span className="font-semibold text-sm text-foreground whitespace-nowrap">
                      {milk.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Addon: SELECTOR */}
          {selectorGroups.map((group) => (
            <div key={group.id} className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {group.name}{group.is_required ? " *" : ""}
              </h3>
              <div className="space-y-2">
                {/* Filter out default options to behave like toggle */}
                {group.options.filter(o => !o.is_default).map((opt) => {
                  const isSelected = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectorChange(group, opt.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-border bg-background hover:border-primary/30"
                      )}
                    >
                      <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                      {opt.price_vnd > 0 && (
                        <span className="text-sm font-semibold text-primary">
                          +{opt.price_vnd / 1000} 🐟
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Addon: QUANTITY */}
          {quantityGroups.map((group) => {
            const qty = quantityMap[group.id] ?? 0;
            const max = group.max_quantity ?? 10;
            const opt = group.options[0];
            if (!opt) return null;
            
            const pricePerQty = opt.gram_value != null 
                ? (opt.gram_value * activePowderPricePerGram) 
                : opt.price_vnd;

            return (
              <div key={group.id} className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {group.name}
                </h3>
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                  <div>
                    <span className="font-semibold text-sm text-foreground">{group.name}</span>
                    {pricePerQty > 0 && (
                      <p className="text-[11px] font-semibold text-primary mt-1">
                        +{pricePerQty / 1000} 🐟 / phần
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-secondary/40 rounded-full px-2 py-1">
                    <button
                      onClick={() =>
                        setQuantityMap((prev) => ({
                          ...prev,
                          [group.id]: Math.max(0, qty - 1),
                        }))
                      }
                      className="w-7 h-7 rounded-full bg-background flex items-center justify-center hover:bg-background/80 shadow-sm transition-colors"
                    >
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="text-sm font-semibold w-4 text-center text-foreground">
                      {qty}
                    </span>
                    <button
                      onClick={() =>
                        setQuantityMap((prev) => ({
                          ...prev,
                          [group.id]: Math.min(max, qty + 1),
                        }))
                      }
                      className="w-7 h-7 rounded-full bg-background flex items-center justify-center hover:bg-background/80 shadow-sm transition-colors"
                    >
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Addon: TOGGLE */}
          {toggleGroups.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Thêm Topping
              </h3>
              <div className="space-y-2">
                {toggleGroups.map((group) => {
                  const toggleOpt = group.options[0];
                  if (!toggleOpt) return null;
                  const enabled = selectedOptionIds.includes(toggleOpt.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleToggleChange(toggleOpt.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                        enabled
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-border bg-background hover:border-primary/30"
                      )}
                    >
                      <span className="font-semibold text-sm text-foreground">{group.name}</span>
                      <span className="text-sm font-semibold text-primary">
                        +{toggleOpt.price_vnd / 1000} 🐟
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="mt-6">
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

        {/* Bottom Bar */}
        <div className="fixed bottom-0 inset-x-0 z-[62] bg-background border-t border-border px-5 py-4">
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled()}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold text-sm shadow-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            {freeVoucherId
              ? "Thêm vào giỏ • 🎁 Miễn phí"
              : `Thêm vào giỏ 🐟 → 🐟 ${currentPriceContext.unitPrice / 1000} cá`}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
