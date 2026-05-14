"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import type { MenuItem, AddonGroup, SweetnessLevel, Size } from "@/src/lib/types/menu";
import type { IceOption } from "@/src/lib/types/cart";
import { useCartStore } from "@/src/lib/store/cartStore";
import { usePowderStore } from "@/src/lib/store/powderStore";
import { cn } from "@/src/utils/cn";
import { calcLattePrice, calcFusionPrice, resolveGram } from "@/src/utils/pricing";
import { SWEETNESS_OPTIONS, ICE_OPTIONS, SIZE_LABELS } from "@/src/constants/orderOptions";

interface ProductModalProps {
  item: MenuItem;
  latteItems: MenuItem[];
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ item, latteItems, onClose }) => {
  const { addItem } = useCartStore();
  const powders = usePowderStore((s) => s.data);
  const defaultPowderGrams = usePowderStore((s) => s.defaultPowderGram);

  // ── State ───────────────────────────────────────────────────────────────

  const [selectedSize, setSelectedSize] = useState<Size>(() => {
    const available = item.sizes ?? [];
    return (available.find((s) => s.size === "L") ?? available[0])?.size ?? "M";
  });
  const [sweetness, setSweetness] = useState<SweetnessLevel>("QUARTER");
  const [iceOption, setIceOption] = useState<IceOption>("NORMAL");
  const [coldwhisk, setColdwhisk] = useState(false);
  const [selectedPowderId, setSelectedPowderId] = useState<string>(item.resolved_default_powder_id ?? "");
  const [selectedMilkId, setSelectedMilkId] = useState<string>(() => {
    return item.milk_types?.find(m => m.is_default)?.id ?? item.milk_types?.[0]?.id ?? "";
  });

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() =>
    item.addon_groups.flatMap((g) =>
      g.options.filter((o) => o.is_default).map((o) => o.id)
    )
  );
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      item.addon_groups
        .filter((g) => g.type === "QUANTITY")
        .map((g) => [g.id, 0])
    )
  );
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

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

  const handleAddToCart = () => {
    const quantityAddonOptions = item.addon_groups
      .filter((g) => g.type === "QUANTITY")
      .flatMap((g) => {
        const qty = quantityMap[g.id] ?? 0;
        return qty > 0 && g.options[0]
          ? [{ option_id: g.options[0].id, quantity: qty }]
          : [];
      });

    addItem({
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      imageUrl: item.image_url,
      size: selectedSize,
      unitPrice: currentPriceContext.unitPrice,
      quantity,
      sweetness,
      iceOption,
      coldwhisk,
      note,
      selectedOptionIds,
      quantityMap,
      addonsPrice: currentPriceContext.addonsCost,
      quantityAddonOptions,
      selectedPowderId: isLatte ? undefined : selectedPowderId,
      selectedMilkTypeId: isLatte ? selectedMilkId : undefined,
      clientPriceVnd: currentPriceContext.unitPrice,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="product-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="product-content"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[101] max-h-[92vh] overflow-y-auto rounded-t-[2.5rem] bg-[#fdfcf7] border-t border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center transition-transform hover:rotate-90 z-10"
        >
          <X className="w-6 h-6 text-primary" />
        </button>

        <div className="px-6 pb-40">
          <div className="pt-8 pb-6 border-b border-border/40">
            <h2 className="font-serif text-3xl font-bold text-primary">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-primary/60 mt-2 leading-relaxed">{item.description}</p>
            )}
          </div>

          {/* Size Selector */}
          {item.sizes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                CHON SIZE *
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {item.sizes.map((s) => {
                  // Show final calculated price for each size
                  const sizePrice = getPriceForContext(s.size, activePowderId).unitPrice;
                  return (
                    <button
                      key={s.size}
                      onClick={() => setSelectedSize(s.size)}
                      className={cn(
                        "rounded-2xl border-2 py-4 px-2 text-center transition-all flex flex-col items-center justify-center gap-1",
                        selectedSize === s.size
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-border bg-white hover:border-primary/30"
                      )}
                    >
                      <span className="block font-bold text-sm text-primary">
                        {SIZE_LABELS[s.size]}
                      </span>
                      <p className="text-[11px] font-bold text-primary mt-1 flex items-center gap-1">
                        <span className="text-sm">🐟</span> {sizePrice / 1000} cá
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sweetness Slider */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40">
                DO NGOT
              </h3>
              <span className="text-sm font-bold text-primary">
                {SWEETNESS_OPTIONS.find((o) => o.value === sweetness)?.label}
              </span>
            </div>
            {(() => {
              const activeIdx = SWEETNESS_OPTIONS.findIndex((o) => o.value === sweetness);
              return (
                <div className="px-4">
                  <div className="relative h-6 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={SWEETNESS_OPTIONS.length - 1}
                      step={1}
                      value={activeIdx}
                      onChange={(e) =>
                        setSweetness(SWEETNESS_OPTIONS[Number(e.target.value)].value)
                      }
                      className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
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
                                "block w-3 h-3 rounded-full transition-all border-2",
                                filled
                                  ? "bg-primary border-primary"
                                  : "bg-[#fdfcf7] border-primary/30",
                                isActive && "scale-150 shadow-md"
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative h-6 mt-4">
                    {SWEETNESS_OPTIONS.map((opt, i) => (
                      <div
                        key={opt.value}
                        style={{ left: `${(i / (SWEETNESS_OPTIONS.length - 1)) * 100}%` }}
                        className={cn(
                          "absolute top-0 -translate-x-1/2 text-[10px] whitespace-nowrap transition-colors",
                          sweetness === opt.value
                            ? "text-primary font-bold"
                            : "text-primary/40 font-medium"
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

          {/* Ice Option (Toggle non-default) */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
              LUONG DA
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {ICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIceOption(iceOption === opt.value ? "NORMAL" : opt.value)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                    iceOption === opt.value
                      ? "bg-primary text-white border-primary shadow-lg"
                      : "bg-[#d9e4d4] text-primary/70 border-transparent hover:bg-[#c9d4c4]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coldwhisk */}
          <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-2xl border border-border shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                DANH LANH (COLDWHISK)
              </h3>
              <p className="text-[11px] text-primary/60 mt-1 font-medium">Lớp foam matcha mịn màng</p>
            </div>
            <button
              onClick={() => setColdwhisk(!coldwhisk)}
              className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                coldwhisk ? "bg-primary" : "bg-[#d9e4d4]"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                  coldwhisk ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Powder Swap (Fusion) */}
          {!isLatte && item.allowed_powder_ids.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                CHON LOAI BOT MATCHA
              </h3>
              <div className="flex flex-col gap-3">
                {[item.resolved_default_powder_id!, ...item.allowed_powder_ids.filter(id => id !== item.resolved_default_powder_id)].map((pid) => {
                  const pwd = powders.find((p) => p.id === pid);
                  if (!pwd) return null;
                  
                  // Calculate the total price with this powder
                  const priceContext = getPriceForContext(selectedSize, pid);
                  const diff = priceContext.unitPrice - currentBasePowderPriceContext.unitPrice;
                  
                  return (
                    <button
                      key={pid}
                      onClick={() => setSelectedPowderId(pid)}
                      className={cn(
                        "rounded-2xl border-2 py-3 px-4 text-left transition-all flex items-center justify-between",
                        selectedPowderId === pid
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-white hover:border-primary/30"
                      )}
                    >
                      <div>
                        <span className="block font-bold text-sm text-primary">{pwd.name}</span>
                        <span className="block text-[11px] font-medium text-primary/60 mt-1">
                          {pwd.price_per_gram / 1000}k / gram
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-sm text-primary">
                          {priceContext.unitPrice / 1000}k
                        </span>
                        {diff !== 0 && (
                          <span className={cn(
                            "block text-[11px] font-bold mt-0.5",
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
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                CHON LOAI SUA
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {item.milk_types.map((milk) => (
                  <button
                    key={milk.id}
                    onClick={() => setSelectedMilkId(milk.id)}
                    className={cn(
                      "flex-shrink-0 flex flex-col items-center rounded-2xl border-2 px-5 py-3 text-center transition-all min-w-[100px]",
                      selectedMilkId === milk.id
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border bg-white hover:border-primary/30"
                    )}
                  >
                    <span className="font-bold text-sm text-primary whitespace-nowrap">
                      {milk.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Addon: SELECTOR */}
          {selectorGroups.map((group) => (
            <div key={group.id} className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                {group.name.toUpperCase()}{group.is_required ? " *" : ""}
              </h3>
              <div className="space-y-2">
                {/* Filter out default options to behave like toggle as requested */}
                {group.options.filter(o => !o.is_default).map((opt) => {
                  const isSelected = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectorChange(group, opt.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-2xl border-2 px-5 py-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-border bg-white hover:border-primary/30"
                      )}
                    >
                      <span className="font-bold text-sm text-primary">{opt.label}</span>
                      {opt.price_vnd > 0 && (
                        <span className="text-sm font-bold text-primary">
                          +{opt.price_vnd / 1000} 🐟
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Addon: QUANTITY (Extra Matcha uses dynamic price) */}
          {quantityGroups.map((group) => {
            const qty = quantityMap[group.id] ?? 0;
            const max = group.max_quantity ?? 10;
            const opt = group.options[0];
            if (!opt) return null;
            
            const pricePerQty = opt.gram_value != null 
                ? (opt.gram_value * activePowderPricePerGram) 
                : opt.price_vnd;

            return (
              <div key={group.id} className="mt-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                  {group.name.toUpperCase()}
                </h3>
                <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-white px-5 py-4">
                  <div>
                    <span className="font-bold text-sm text-primary">{group.name}</span>
                    {pricePerQty > 0 && (
                      <p className="text-[10px] font-bold text-primary/60 mt-1">
                        +{pricePerQty / 1000} 🐟 / phần
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-[#d9e4d4] rounded-xl px-3 py-2">
                    <button
                      onClick={() =>
                        setQuantityMap((prev) => ({
                          ...prev,
                          [group.id]: Math.max(0, qty - 1),
                        }))
                      }
                      className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Minus className="w-3 h-3 text-primary" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center text-primary">
                      {qty}
                    </span>
                    <button
                      onClick={() =>
                        setQuantityMap((prev) => ({
                          ...prev,
                          [group.id]: Math.min(max, qty + 1),
                        }))
                      }
                      className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Addon: TOGGLE */}
          {toggleGroups.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                THEM VAO BUNG CA 🐟
              </h3>
              <div className="space-y-3">
                {toggleGroups.map((group) => {
                  const toggleOpt = group.options[0];
                  if (!toggleOpt) return null;
                  const enabled = selectedOptionIds.includes(toggleOpt.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleToggleChange(toggleOpt.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all",
                        enabled
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-border bg-white hover:border-primary/30"
                      )}
                    >
                      <div>
                        <span className="font-bold text-sm text-primary">{group.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        +{toggleOpt.price_vnd / 1000} 🐟
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
              GHI CHU
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bạn có muốn dặn dò gì thêm không?"
              className="w-full rounded-2xl border-2 border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 inset-x-0 z-[110] bg-white/95 backdrop-blur-md border-t border-border px-6 py-6 pb-10 flex items-center gap-4">
          <div className="flex items-center gap-4 bg-[#d9e4d4] rounded-2xl px-4 py-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center hover:bg-white/60 transition-colors"
            >
              <Minus className="w-4 h-4 text-primary" />
            </button>
            <span className="text-sm font-bold w-4 text-center text-primary">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center hover:bg-white/60 transition-colors"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Thêm vào giỏ 🐟 →{" "}
            <span className="text-base font-serif">🐟</span>{" "}
            {(currentPriceContext.unitPrice * quantity) / 1000}k
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;
