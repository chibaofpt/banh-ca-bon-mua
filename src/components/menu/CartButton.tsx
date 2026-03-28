"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/src/lib/store/cartStore";
import { useUI } from "@/src/context/UIContext";

/**
 * CartButton is a floating action button that displays the total number of items in the cart.
 * Updated with premium styling and UIProvider connection.
 */
const CartButton: React.FC = () => {
  const { items } = useCartStore();
  const { setCartOpen } = useUI();
  const count = items.length;

  return (
    <button
      onClick={() => setCartOpen(true)}
      className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group lg:hidden"
      aria-label="Mở giỏ hàng"
    >
      <ShoppingBag className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-accent-foreground text-[12px] font-bold rounded-full flex items-center justify-center border-2 border-background"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default CartButton;
