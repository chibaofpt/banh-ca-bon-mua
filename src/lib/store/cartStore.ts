"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/src/lib/types/cart";

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (newItem: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string, size: string) => void;
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
        const existingIndex = items.findIndex(
          (i) =>
            i.id === newItem.id &&
            i.size === newItem.size &&
            i.sweetness === newItem.sweetness
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + 1,
          };
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...newItem, quantity: 1 }] });
        }
      },

      removeItem: (id, size) => {
        set({
          items: get().items.filter((i) => !(i.id === id && i.size === size)),
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
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.totalPrice * i.quantity, 0));
