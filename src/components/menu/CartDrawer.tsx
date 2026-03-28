"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useCartStore } from "@/src/lib/store/cartStore";
import { useUI } from "@/src/context/UIContext";

const CartDrawer = () => {
  const { items, removeItem, clearCart, totalPrice } = useCartStore();
  const { isCartOpen, setCartOpen } = useUI();

  const buildOrderText = () => {
    const lines = items.map((item) => {
      const parts = [item.name];
      if (item.size) parts.push(item.size);
      if (item.sweetness) parts.push(item.sweetness);
      if (item.addons.length) parts.push(`+ ${item.addons.join(", ")}`);
      parts.push(`x${item.quantity}`);
      parts.push(`${item.totalPrice * item.quantity} cá`);
      return parts.join(" | ");
    });
    lines.push(`\nTổng: 🐟 ${totalPrice()} cá`);
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
            className="fixed inset-y-0 right-0 z-71 w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                Giỏ cá 🐟
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg">Giỏ cá trống 😢</p>
                  <p className="text-sm mt-1">Thêm đồ uống vào giỏ nhé</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="py-4 border-b border-border last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{item.name}</span>
                            {item.size && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                                {item.size}
                              </span>
                            )}
                            {item.sweetness && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/70 border border-border">
                                {item.sweetness}
                              </span>
                            )}
                          </div>
                          {item.addons.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              + {item.addons.join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="flex items-start gap-2 ml-3">
                          <span className="text-sm font-semibold text-primary whitespace-nowrap">
                            🐟 {item.totalPrice * item.quantity} cá
                          </span>
                          <button
                            onClick={() => removeItem(item.id, item.size)}
                            className="text-accent hover:text-destructive transition-colors mt-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-bold text-foreground">Tổng</span>
                  <span className="font-serif text-lg font-bold text-primary">🐟 {totalPrice()} cá</span>
                </div>
                <button
                  onClick={handleCopyAndZalo}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-semibold text-sm shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Copy đơn & mở Zalo 🐟
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-center text-sm text-accent hover:text-destructive transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xoá giỏ
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
