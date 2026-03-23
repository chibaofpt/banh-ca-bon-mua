"use client";

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/src/lib/store/cartStore';
import { useBodyScrollLock } from '@/src/hooks/useBodyScrollLock';
import { formatPrice } from '@/src/utils/formatPrice';
import { buildZaloMessage } from '@/src/utils/buildZaloMessage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  zaloNumber: string;
}

/**
 * CartDrawer is a sliding side panel that allows users to review their items,
 * adjust quantities (removal), and proceed to Zalo checkout.
 */
const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, zaloNumber }) => {
  useBodyScrollLock(isOpen);
  const { items, removeItem, clearCart, totalPrice } = useCartStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [toast, setToast] = useState('');

  // Handle animation state for smooth transitions
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const handleZaloOrder = async () => {
    const msg = buildZaloMessage(items);
    try {
      await navigator.clipboard.writeText(msg);
      setToast('Đã copy đơn hàng! Paste vào Zalo nhé 🐟');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error('Failed to copy order:', err);
    }
    window.open(`https://zalo.me/${zaloNumber}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-100 flex justify-end">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-101 ${isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div
        className={`relative w-full max-w-sm bg-white h-full shadow-2xl z-102 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <header className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-[18px] font-bold text-[#16610C]">Giỏ cá 🐟</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#5a8a52] hover:bg-gray-100 rounded-full transition-colors"
          >
            ✕
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">🐟</span>
              <p className="text-[#5a8a52] italic font-medium">Giỏ chưa có cá nào</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item, idx) => (
                <div key={`${item.id}-${item.size}-${idx}`} className="flex justify-between items-start gap-4 pb-4 border-b">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-[14px] font-bold text-[#16610C]">{item.name}</h3>
                      <span className="px-2 py-0.5 bg-[#eaf5e0] text-[#16610C] text-[10px] font-bold rounded-full border border-[#d0e8c8]">
                        {item.size}
                      </span>
                      <span className="px-2 py-0.5 bg-white text-[#5a8a52] text-[10px] font-medium rounded-full border border-[#d0e8c8]">
                        {item.sweetness}
                      </span>
                    </div>
                    {item.addons.length > 0 && (
                      <p className="text-[11px] text-[#5a8a52] mb-1">
                        + {item.addons.join(', ')}
                      </p>
                    )}
                    <p className="text-[11px] text-[#888]">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[13px] font-bold text-[#16610C]">
                      {formatPrice(item.totalPrice * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id, item.size)}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                      title="Xoá món"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <footer className="p-4 bg-white border-t space-y-3 relative">
            {/* Toast Notification */}
            {toast && (
              <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-[#16610C] text-white py-2.5 px-5 rounded-full text-[13px] font-medium shadow-xl z-50 animate-fade-in-up">
                {toast}
              </div>
            )}

            <div className="flex justify-between items-center mb-2">
              <span className="text-[16px] font-bold text-[#16610C]">Tổng</span>
              <span className="text-[16px] font-bold text-[#16610C]">
                {formatPrice(totalPrice())}
              </span>
            </div>

            <button
              onClick={handleZaloOrder}
              className="w-full bg-[#16610C] text-white rounded-xl py-3.5 text-[15px] font-bold shadow-lg shadow-[#16610C]/20 active:scale-[0.98] transition-all"
            >
              Copy đơn & mở Zalo 🐟
            </button>

            <button
              onClick={clearCart}
              className="w-full text-red-400 text-[12px] font-medium hover:text-red-600 transition-colors py-1"
            >
              Xoá giỏ
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
