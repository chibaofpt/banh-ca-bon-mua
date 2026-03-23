import { useState, useEffect } from 'react';
import type { CartItem, CartStore } from '@/src/lib/types/cart';

/**
 * Lightweight custom state management for the Shopping Cart.
 * Follows the observer pattern to provide reactive updates without external libraries (like Zustand).
 */

// Internal state
let cartItems: CartItem[] = [];
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

/**
 * useCartStore is the main hook used across the application to interact with the cart.
 * It provides the current state and actions to modify the cart.
 */
export const useCartStore = (): CartStore => {
  const [items, setItems] = useState<CartItem[]>(cartItems);

  useEffect(() => {
    // Synchronize local state with the external store whenever it changes
    const handleChange = () => setItems([...cartItems]);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return {
    items,
    
    /**
     * addItem increments quantity if the item (same ID, size, and sweetness) 
     * already exists; otherwise, it adds a new entry.
     */
    addItem: (newItem) => {
      const existingIndex = cartItems.findIndex(
        (i) =>
          i.id === newItem.id &&
          i.size === newItem.size &&
          i.sweetness === newItem.sweetness
      );

      if (existingIndex > -1) {
        cartItems[existingIndex] = {
          ...cartItems[existingIndex],
          quantity: cartItems[existingIndex].quantity + 1,
        };
      } else {
        cartItems.push({ ...newItem, quantity: 1 });
      }
      notify();
    },

    /**
     * removeItem strips all quantities of a specific item-size combination from the cart.
     */
    removeItem: (id, size) => {
      cartItems = cartItems.filter((i) => !(i.id === id && i.size === size));
      notify();
    },

    /**
     * clearCart empties the entire shopping bag.
     */
    clearCart: () => {
      cartItems = [];
      notify();
    },

    /**
     * totalItems returns the accumulated count of all fish in the bag.
     */
    totalItems: () => cartItems.reduce((sum, i) => sum + i.quantity, 0),

    /**
     * totalPrice returns the total cost of all items (including addons and quantities).
     */
    totalPrice: () => cartItems.reduce((sum, i) => sum + i.totalPrice * i.quantity, 0),
  };
};
