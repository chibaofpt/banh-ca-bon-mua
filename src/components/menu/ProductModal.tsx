"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import type { MenuItem, Addon, ContactData } from "@/src/lib/types/menu";
import { useCartStore } from "@/src/lib/store/cartStore";
import { cn } from "@/src/lib/utils";

const SWEETNESS_OPTIONS = ["Lạt", "Vừa", "Ngọt", "Rất ngọt", "Ngọt Điên"];
const SIZE_LABELS: Record<string, string> = {
  M: "Cá Con",
  L: "Cá Vừa",
  XL: "Cá Lớn",
};

interface ProductModalProps {
  item: MenuItem;
  addons: Addon[];
  contact: ContactData;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ item, addons, onClose }) => {
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<"M" | "L" | "XL">("M");
  const [selectedSweetness, setSelectedSweetness] = useState("Vừa");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [selectedMilk, setSelectedMilk] = useState("Sữa bò");
  const [quantity, setQuantity] = useState(1);

  const toggleAddon = (id: string) => {
    const next = new Set(selectedAddons);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddons(next);
  };

  const currentPrice = useMemo(() => {
    let base = item.type === "daily" ? item.sizes[selectedSize].price : (item.price || 0);
    selectedAddons.forEach((id) => {
      const addon = addons.find((a) => a.id === id);
      if (addon) base += (addon.price || 0);
    });
    // Add milk price if applicable (Boring Oat = +5)
    if (selectedMilk === "Boring Oat") base += 5;
    return base;
  }, [item, selectedSize, selectedAddons, addons, selectedMilk]);

  const handleAddToCart = () => {
    const selectedAddonNames = Array.from(selectedAddons)
      .map((id) => addons.find((a) => a.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    let addonsPrice = 0;
    selectedAddons.forEach((id) => {
      const addon = addons.find((a) => a.id === id);
      if (addon) addonsPrice += (addon.price || 0);
    });

    selectedAddonNames.push(`Sữa: ${selectedMilk}`);
    if (selectedMilk === "Boring Oat") addonsPrice += 5;

    const basePrice = item.type === "daily" ? item.sizes[selectedSize].price : (item.price || 0);
    const sizeLabel = item.type === "daily" ? SIZE_LABELS[selectedSize] : "Một size";
    const sizeML = item.type === "daily" ? item.sizes[selectedSize].ml : 0;

    for (let i = 0; i < quantity; i++) {
        addItem({
            id: item.id,
            name: item.name,
            size: sizeLabel,
            ml: sizeML,
            sweetness: selectedSweetness,
            addons: selectedAddonNames,
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
        {/* Banner - Match Image 5 structure */}
        <div className="relative aspect-video bg-[#d9e4d4] overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-transform hover:rotate-90"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="px-6 pb-40">
          {/* Header */}
          <div className="pt-8 pb-6 border-b border-border/40">
            <h2 className="font-serif text-3xl font-bold text-primary">{item.name}</h2>
            <p className="text-sm text-primary/60 mt-2 leading-relaxed">{item.description}</p>
          </div>

          {/* Size Selector - Match Image 5 */}
          {item.type === "daily" && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">CHỌN SIZE</h3>
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
                    <span className="block font-bold text-sm text-primary">{SIZE_LABELS[size]}</span>
                    <span className="block text-[10px] text-primary/40 leading-none">{item.sizes[size].ml}ml</span>
                    <p className="text-[11px] font-bold text-primary mt-1 flex items-center gap-1">
                       <span className="text-sm">🐟</span> {item.sizes[size].price} cá
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sweetness - Match Image 5 */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">ĐỘ NGỌT</h3>
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

          {/* Add-ons - Match Image 5 */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/40 mb-4">THÊM VÀO BỤNG CÁ 🐟</h3>
            <div className="space-y-3">
              {addons.map((addon) => {
                // Milk Selector UI refinement to match "Oatside" style
                if (addon.type === "milk_selector") {
                   return (
                      <div key={addon.id} className="space-y-3">
                         {addon.options?.slice(1).map((opt) => (
                            <button
                               key={opt.label}
                               onClick={() => setSelectedMilk(selectedMilk === opt.label ? "Sữa bò" : opt.label)}
                               className={cn(
                                  "w-full flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all",
                                  selectedMilk === opt.label
                                     ? "border-primary bg-primary/5"
                                     : "border-border bg-white"
                               )}
                            >
                               <div>
                                  <span className="font-bold text-sm text-primary">{opt.label === "Boring Oat" ? "Oatside" : opt.label}</span>
                                  <p className="text-[10px] text-primary/40 mt-1">Thay sữa bò bằng sữa hạt chất lượng</p>
                               </div>
                               <span className="text-sm font-bold text-primary">+{opt.price} 🐟</span>
                            </button>
                         ))}
                      </div>
                   );
                }

                // Regular Addons
                if (addon.price) {
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all",
                          selectedAddons.has(addon.id)
                            ? "border-primary bg-primary/5 shadow-inner"
                            : "border-border bg-white hover:border-primary/30"
                        )}
                      >
                        <div>
                          <span className="font-bold text-sm text-primary">{addon.name}</span>
                          <span className="block text-[10px] text-primary/40 mt-1">{addon.description}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">+{addon.price} 🐟</span>
                      </button>
                    );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* Sticky bottom bar - Match Image 5 exactly */}
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
            Thêm vào giỏ 🐟 → <span className="text-base font-serif">🐟</span> {currentPrice * quantity} cá
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;
