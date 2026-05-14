"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import type { MenuItem, AddonGroup, SweetnessLevel } from "@/src/lib/types/menu";
import { useCartStore } from "@/src/lib/store/cartStore";
import { cn } from "@/src/lib/utils";

const SWEETNESS_OPTIONS: { label: string; value: SweetnessLevel }[] = [
  { label: "Lat", value: "NONE" },
  { label: "It ngot", value: "QUARTER" },
  { label: "Vua", value: "HALF" },
  { label: "Ngot", value: "THREE_QUARTER" },
  { label: "Rat ngot", value: "FULL" },
];

const SIZE_LABELS: Record<string, string> = {
  M: "Ca Con",
  L: "Ca Vua",
  XL: "Ca Lon",
};

interface ProductModalProps {
  item: MenuItem;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ item, onClose }) => {
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<"M" | "L" | "XL">("L");
  const [selectedSweetness, setSelectedSweetness] = useState<SweetnessLevel>("HALF");
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

  // ── Identify special addon groups ─────────────────────────────────────

  const milkGroup: AddonGroup | undefined = useMemo(
    () => item.addon_groups.find((g) => g.name === "Loai sua"),
    [item.addon_groups]
  );

  const quantityGroups = useMemo(
    () => item.addon_groups.filter((g) => g.type === "QUANTITY"),
    [item.addon_groups]
  );

  const selectorGroups = useMemo(
    () => item.addon_groups.filter((g) => g.type === "SELECTOR" && g.name !== "Loai sua"),
    [item.addon_groups]
  );

  const toggleGroups = useMemo(
    () => item.addon_groups.filter((g) => g.type === "TOGGLE"),
    [item.addon_groups]
  );

  // ── Milk: find selected option ─────────────────────────────────────────

  const selectedMilkId = milkGroup
    ? (selectedOptionIds.find((id) => milkGroup.options.some((o) => o.id === id)) ??
      milkGroup.options.find((o) => o.is_default)?.id ??
      milkGroup.options[0]?.id ??
      "")
    : "";

  // ── Base price ─────────────────────────────────────────────────────────

  const basePrice = useMemo(() => {
    // Phase 2: all items use base_price_vnd from sizes.
    return item.sizes.find((s) => s.size === selectedSize)?.base_price_vnd ?? 0;
  }, [item.sizes, selectedSize]);

  // ── Addons price ───────────────────────────────────────────────────────

  const addonsPrice = useMemo(() => {
    let total = 0;
    for (const g of item.addon_groups) {
      if (g.type === "QUANTITY") {
        const qty = quantityMap[g.id] ?? 0;
        if (qty > 0) total += qty * (g.options[0]?.price_vnd ?? 0);
      } else {
        for (const opt of g.options) {
          if (selectedOptionIds.includes(opt.id)) {
            total += opt.price_vnd;
          }
        }
      }
    }
    return total;
  }, [item.addon_groups, selectedOptionIds, quantityMap]);

  const unitPrice = basePrice + addonsPrice;

  // ── Handlers ───────────────────────────────────────────────────────────

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

  const handleAddToCart = () => {
    const sizeLabel = SIZE_LABELS[selectedSize] ?? "Mot size";
    const sizeML = item.sizes.find((s) => s.size === selectedSize)?.base_price_vnd ?? 0;

    addItem({
      id: item.id,
      name: item.name,
      size: sizeLabel,
      ml: sizeML,
      sweetness: selectedSweetness === "NONE" ? "Lat" :
                 selectedSweetness === "QUARTER" ? "It ngot" :
                 selectedSweetness === "HALF" ? "Vua" :
                 selectedSweetness === "THREE_QUARTER" ? "Ngot" : "Rat ngot",
      addons: [],
      basePrice,
      addonsPrice,
      totalPrice: unitPrice,
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
        {/* Close */}
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

          {/* Size Selector — all Phase 2 items have sizes */}
          {item.sizes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                CHON SIZE
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {item.sizes.map((s) => (
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
                      <span className="text-sm">🐟</span> {s.base_price_vnd / 1000} ca
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sweetness */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
              DO NGOT
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {SWEETNESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSweetness(opt.value)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                    selectedSweetness === opt.value
                      ? "bg-primary text-white shadow-lg"
                      : "bg-[#d9e4d4] text-primary/70 hover:bg-[#c9d4c4]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Milk Selector */}
          {milkGroup && milkGroup.options.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                LOAI SUA
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {milkGroup.options.map((opt) => {
                  const isSelected = selectedMilkId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectorChange(milkGroup, opt.id)}
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
                        {opt.price_vnd === 0 ? "Mien phi" : `+${opt.price_vnd / 1000} 🐟`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other SELECTOR groups */}
          {selectorGroups.map((group) => (
            <div key={group.id} className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                {group.name.toUpperCase()}{group.is_required ? " *" : ""}
              </h3>
              <div className="space-y-2">
                {group.options.map((opt) => {
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

          {/* QUANTITY groups */}
          {quantityGroups.map((group) => {
            const qty = quantityMap[group.id] ?? 0;
            const max = group.max_quantity ?? 10;
            return (
              <div key={group.id} className="mt-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">
                  {group.name.toUpperCase()}
                </h3>
                <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-white px-5 py-4">
                  <div>
                    <span className="font-bold text-sm text-primary">{group.name}</span>
                    {group.options[0] && group.options[0].price_vnd > 0 && (
                      <p className="text-[10px] text-primary/40 mt-1">
                        {group.options[0].price_vnd / 1000} 🐟 / gram
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

          {/* TOGGLE groups */}
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
            Them vao gio 🐟 →{" "}
            <span className="text-base font-serif">🐟</span>{" "}
            {(unitPrice * quantity) / 1000} ca
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;
