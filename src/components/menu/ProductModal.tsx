"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import type { MenuItem, Addon, AddonOption } from "@/src/lib/types/menu";
import type { SweetnessValue } from "@/src/lib/types/cart";
import { useCartStore } from "@/src/lib/store/cartStore";
import { cn } from "@/src/lib/utils";

const SWEETNESS_OPTIONS: SweetnessValue[] = ["Lạt", "Vừa", "Ngọt", "Rất ngọt", "Ngọt Điên"];
const SIZE_LABELS: Record<string, string> = {
  M: "Cá Con",
  L: "Cá Vừa",
  XL: "Cá Lớn",
};

interface ProductModalProps {
  item: MenuItem;
  addons: Addon[];
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ item, addons, onClose }) => {
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<"M" | "L" | "XL">("M");
  const [selectedSweetness, setSelectedSweetness] = useState<SweetnessValue>("Vừa");
  /** IDs of enabled TOGGLE addons */
  const [enabledToggles, setEnabledToggles] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  /** Matcha powder quantity (0–3 grams) */
  const [matchaGrams, setMatchaGrams] = useState(0);

  // ── Identify special addon groups ─────────────────────────────────────────
  const milkAddon = useMemo(
    () => addons.find((a) => a.type === "milk_selector"),
    [addons]
  );

  const matchaAddon = useMemo(
    () => addons.find((a) => a.name === "Thêm bột matcha" && a.type === "QUANTITY"),
    [addons]
  );

  const toggleAddons = useMemo(
    () => addons.filter((a) => a.type === "TOGGLE"),
    [addons]
  );

  // ── Milk: default option is the one with is_default: true ─────────────────
  const defaultMilkOption: AddonOption | null = useMemo(() => {
    if (!milkAddon?.options) return null;
    return milkAddon.options.find((o) => o.is_default) ?? milkAddon.options[0] ?? null;
  }, [milkAddon]);

  const [selectedMilkId, setSelectedMilkId] = useState<string>(
    () => defaultMilkOption?.id ?? ""
  );

  // When default option resolves after mount, sync state
  const resolvedMilkId = selectedMilkId || defaultMilkOption?.id || "";

  // ── Base price ────────────────────────────────────────────────────────────
  const basePrice = useMemo(() => {
    if (item.type === "daily") {
      return item.sizes?.[selectedSize]?.price ?? 0;
    }
    return item.price ?? 0;
  }, [item, selectedSize]);

  // ── Milk price ────────────────────────────────────────────────────────────
  const milkPrice = useMemo(() => {
    if (!milkAddon?.options) return 0;
    const selected = milkAddon.options.find((o) => o.id === resolvedMilkId);
    if (!selected) return 0;
    // is_default = Sữa bò = price 0; others may have a price
    return selected.price;
  }, [milkAddon, resolvedMilkId]);

  // ── Matcha price per gram ─────────────────────────────────────────────────
  const matchaPricePerGram = useMemo(() => {
    if (!matchaAddon) return 0;
    if (item.type === "seasonal") {
      // 20% of item price, rounded, max context up to caller
      return Math.round((item.price ?? 0) * 0.2);
    }
    // daily or recipe: use DB option price (first option in the group)
    return matchaAddon.options?.[0]?.price ?? 0;
  }, [matchaAddon, item]);

  // ── Toggle addons total price ─────────────────────────────────────────────
  const togglesPrice = useMemo(() => {
    let total = 0;
    for (const addon of toggleAddons) {
      if (enabledToggles.has(addon.id)) {
        total += addon.price ?? 0;
      }
    }
    return total;
  }, [toggleAddons, enabledToggles]);

  // ── Total price per unit ──────────────────────────────────────────────────
  const unitPrice = useMemo(() => {
    return basePrice + milkPrice + matchaGrams * matchaPricePerGram + togglesPrice;
  }, [basePrice, milkPrice, matchaGrams, matchaPricePerGram, togglesPrice]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleToggleAddon = (id: string) => {
    setEnabledToggles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddToCart = () => {
    const sizeLabel =
      item.type === "daily" ? SIZE_LABELS[selectedSize] ?? "Một size" : "Một size";
    const sizeML =
      item.type === "daily" ? item.sizes?.[selectedSize]?.ml ?? 0 : 0;

    const addonNames: string[] = [];

    // Milk label
    if (milkAddon?.options) {
      const milkOpt = milkAddon.options.find((o) => o.id === resolvedMilkId);
      if (milkOpt) addonNames.push(`Sữa: ${milkOpt.label}`);
    }

    // Matcha
    if (matchaAddon && matchaGrams > 0) {
      addonNames.push(`Bột matcha: ${matchaGrams}g`);
    }

    // Enabled toggles
    for (const addon of toggleAddons) {
      if (enabledToggles.has(addon.id)) {
        addonNames.push(addon.name);
      }
    }

    const addonsPrice = milkPrice + matchaGrams * matchaPricePerGram + togglesPrice;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.id,
        name: item.name,
        size: sizeLabel,
        ml: sizeML,
        sweetness: selectedSweetness,
        addons: addonNames,
        basePrice,
        addonsPrice,
        totalPrice: basePrice + addonsPrice,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="product-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="product-content"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-101 max-h-[92vh] overflow-y-auto rounded-t-[2.5rem] bg-background border-t border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center transition-transform hover:rotate-90 z-10"
        >
          <X className="w-6 h-6 text-primary" />
        </button>

        <div className="px-6 pb-40">
          {/* Header */}
          <div className="pt-8 pb-6 border-b border-border/40">
            <h2 className="font-serif text-3xl font-bold text-primary">{item.name}</h2>
            <p className="text-sm text-primary/60 mt-2 leading-relaxed">{item.description}</p>
          </div>

          {/* Size Selector — daily items only */}
          {item.type === "daily" && item.sizes && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                CHỌN SIZE
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(["M", "L", "XL"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "rounded-2xl border-2 py-4 px-2 text-center transition-all flex flex-col items-center justify-center gap-1",
                      selectedSize === size
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border bg-white hover:border-primary/30"
                    )}
                  >
                    <span className="block font-bold text-sm text-primary">
                      {SIZE_LABELS[size]}
                    </span>
                    <span className="block text-[10px] text-primary/40 leading-none">
                      {item.sizes[size].ml}ml
                    </span>
                    <p className="text-[11px] font-bold text-primary mt-1 flex items-center gap-1">
                      <span className="text-sm">🐟</span> {item.sizes[size].price} cá
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Flat price display — seasonal and recipe items */}
          {item.type !== "daily" && item.price !== null && (
            <div className="mt-8 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40">
                GIÁ
              </span>
              <span className="text-base font-bold text-primary">
                🐟 {item.price} cá
              </span>
            </div>
          )}

          {/* Sweetness */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
              ĐỘ NGỌT
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {SWEETNESS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedSweetness(opt)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                    selectedSweetness === opt
                      ? "bg-primary text-white shadow-lg"
                      : "bg-[#d9e4d4] text-primary/70 hover:bg-[#c9d4c4]"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Milk Selector — horizontal radio row, exactly one selected at all times */}
          {milkAddon?.options && milkAddon.options.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                LOẠI SỮA
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {milkAddon.options.map((opt) => {
                  const isSelected = resolvedMilkId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (!isSelected) setSelectedMilkId(opt.id);
                      }}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center rounded-2xl border-2 px-5 py-3 text-center transition-all min-w-[90px]",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-border bg-white hover:border-primary/30"
                      )}
                    >
                      <span className="font-bold text-sm text-primary whitespace-nowrap">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-primary/40 mt-1">
                        {opt.price === 0 ? "Miễn phí" : `+${opt.price} 🐟`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matcha Powder stepper */}
          {matchaAddon && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                {matchaAddon.name.toUpperCase()}
              </h3>
              <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-white px-5 py-4">
                <div>
                  <span className="font-bold text-sm text-primary">Bột matcha</span>
                  <p className="text-[10px] text-primary/40 mt-1">
                    {matchaPricePerGram > 0
                      ? `${matchaPricePerGram} 🐟 / gram`
                      : "Miễn phí"}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-[#d9e4d4] rounded-xl px-3 py-2">
                  <button
                    onClick={() => setMatchaGrams(Math.max(0, matchaGrams - 1))}
                    className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Minus className="w-3 h-3 text-primary" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center text-primary">
                    {matchaGrams}
                  </span>
                  <button
                    onClick={() =>
                      setMatchaGrams(
                        Math.min(
                          matchaAddon.max_quantity ?? 3,
                          matchaGrams + 1
                        )
                      )
                    }
                    className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Plus className="w-3 h-3 text-primary" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TOGGLE addons */}
          {toggleAddons.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                THÊM VÀO BỤNG CÁ 🐟
              </h3>
              <div className="space-y-3">
                {toggleAddons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleToggleAddon(addon.id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all",
                      enabledToggles.has(addon.id)
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border bg-white hover:border-primary/30"
                    )}
                  >
                    <div>
                      <span className="font-bold text-sm text-primary">{addon.name}</span>
                      {addon.description && (
                        <span className="block text-[10px] text-primary/40 mt-1">
                          {addon.description}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-primary">
                      +{addon.price ?? 0} 🐟
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 inset-x-0 z-110 bg-white/95 backdrop-blur-md border-t border-border px-6 py-6 pb-10 flex items-center gap-4">
          <div className="flex items-center gap-4 bg-[#d9e4d4] rounded-2xl px-4 py-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center hover:bg-white/60 transition-colors"
            >
              <Minus className="w-4 h-4 text-primary" />
            </button>
            <span className="text-sm font-bold w-4 text-center text-primary">
              {quantity}
            </span>
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
            {unitPrice * quantity} cá
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;
