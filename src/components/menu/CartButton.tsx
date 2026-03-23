"use client";

import React from 'react';
import { useCartStore } from '@/src/lib/store/cartStore';

interface CartButtonProps {
  onClick: () => void;
}

/**
 * CartButton is a floating action button that displays the total number of items in the cart.
 */
const CartButton: React.FC<CartButtonProps> = ({ onClick }) => {
  const { totalItems } = useCartStore();
  const count = totalItems();

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-[52px] h-[52px] bg-[#16610C] text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
      aria-label="Mở giỏ hàng"
    >
      <span className="text-[20px]">🛒</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
};

export default CartButton;
