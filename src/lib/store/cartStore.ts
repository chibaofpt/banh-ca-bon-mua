"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/src/lib/types/cart";

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (newItem: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
}

/**
 * useCartStore — global shopping cart state managed by Zustand.
 * Persisted to localStorage so the fish stay in the bag after refresh.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      setCartOpen: (open) => set({ isCartOpen: open }),

      addItem: (newItem) => {
        const { items } = get();
        // In Phase 2, we don't deduplicate by id+size+sweetness anymore.
        // Each addition is a unique row with its own cartId.
        const cartId = crypto.randomUUID();
        set({ items: [...items, { ...newItem, cartId }] });
      },

      removeItem: (cartId) => {
        set({
          items: get().items.filter((i) => i.cartId !== cartId),
        });
      },

      updateQuantity: (cartId, quantity) => {
        set({
          items: get().items.map((i) =>
            i.cartId === cartId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: "bcbm-cart" }
  )
);

/** Computed helpers for easier usage in components */
export const useCartTotalItems = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

export const useCartTotalPrice = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.clientPriceVnd * i.quantity, 0));
