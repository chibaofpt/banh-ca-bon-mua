"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useCartStore, useCartTotalPrice } from "@/src/lib/store/cartStore";
import Image from "next/image";
import { SWEETNESS_OPTIONS, ICE_OPTIONS } from "@/src/constants/orderOptions";
import { usePowderStore } from "@/src/lib/store/powderStore";

const CartDrawer = () => {
  const { items, removeItem, clearCart, isCartOpen, setCartOpen } = useCartStore();
  const powders = usePowderStore((s) => s.data);
  const totalPrice = useCartTotalPrice();

  const buildOrderText = () => {
    const lines = items.map((item) => {
      const parts = [item.name];
      if (item.size) parts.push(item.size);
      
      const sweetnessLabel = SWEETNESS_OPTIONS.find(o => o.value === item.sweetness)?.label;
      if (sweetnessLabel) parts.push(sweetnessLabel);
      
      const iceLabel = ICE_OPTIONS.find(o => o.value === item.iceOption)?.label;
      if (iceLabel) parts.push(iceLabel);
      
      if (item.coldwhisk) parts.push("Đánh lạnh");

      if (item.selectedPowderId) {
         const pwd = powders.find(p => p.id === item.selectedPowderId);
         if (pwd) parts.push(`Bột: ${pwd.name}`);
      }

      if (item.selectedOptionIds.length > 0) parts.push(`${item.selectedOptionIds.length} topping`);
      if (item.quantityAddonOptions.length > 0) parts.push(`${item.quantityAddonOptions.length} extra`);
      
      parts.push(`x${item.quantity}`);
      parts.push(`${(item.clientPriceVnd * item.quantity) / 1000}k`);
      return parts.join(" | ");
    });
    lines.push(`\nTổng: 🐟 ${totalPrice / 1000}k cá`);
    return `Đơn hàng Bánh Cá Bốn Mùa:\n${lines.join("\n")}`;
  };

  const handleCopyAndZalo = () => {
    navigator.clipboard.writeText(buildOrderText());
    window.open("https://zalo.me", "_blank");
  };

  return (
    <AnimatePresence mode="wait">
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-71 w-full max-w-sm bg-[#fdfcf7] border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
                Giỏ cá <span className="text-3xl">🐟</span>
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {items.length === 0 ? (
                <div className="text-center py-20 text-primary/40 space-y-4">
                  <span className="text-6xl block">😢</span>
                  <p className="font-bold text-lg italic">Giỏ cá trống</p>
                  <p className="text-sm">Thêm đồ uống vào giỏ nhé</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {items.map((item) => (
                    <div key={item.cartId} className="p-4 rounded-2xl bg-white border border-border shadow-sm relative overflow-hidden flex gap-3">
                      {/* Image Thumbnail */}
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-secondary/10 border border-border/50 relative">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🍵</div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-primary leading-tight truncate">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.cartId)}
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-primary/40 hover:text-red-500 hover:bg-red-50 transition-colors -mt-1 -mr-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Explicit Customizations List */}
                        <div className="mt-1.5 space-y-0.5">
                          {item.details && item.details.length > 0 ? (
                            item.details.map((detail, idx) => (
                              <p key={idx} className="text-[11px] text-primary/60 font-medium flex items-start gap-1">
                                <span className="text-primary/30 mt-[2px]">•</span> <span>{detail}</span>
                              </p>
                            ))
                          ) : (
                            <p className="text-[11px] text-primary/60 font-medium">Size {item.size}</p>
                          )}
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-[11px] text-primary font-bold">Số lượng: {item.quantity}</p>
                          <span className="text-sm font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                            {(item.clientPriceVnd * item.quantity) / 1000}k
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/40 bg-white px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary/60 text-sm tracking-widest uppercase">TỔNG CỘNG</span>
                  <span className="font-serif text-2xl font-bold text-primary">
                    <span className="text-3xl">🐟</span> {totalPrice / 1000}k
                  </span>
                </div>
                <button
                  onClick={handleCopyAndZalo}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Gửi đơn qua Zalo <span className="text-lg">💬</span>
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs font-bold text-primary/40 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-1 py-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xoá tất cả
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
