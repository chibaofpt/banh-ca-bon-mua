import { formatPrice } from './formatPrice';
import type { CartItem } from '@/src/lib/types/cart';

/**
 * buildZaloMessage constructs a pre-filled, multi-item message string for Zalo ordering.
 * It follows the branded messaging format for Bánh Cá Bốn Mùa.
 * 
 * @param items - An array of CartItem objects representing the user's shopping bag.
 * @returns A formatted string ready for URL encoding.
 */
export const buildZaloMessage = (items: CartItem[]): string => {
  const lines = items.map((i) => {
    const addonStr = i.addons.length > 0 ? `\n  + ${i.addons.join(', ')}` : '';
    const qty = i.quantity > 1 ? ` x${i.quantity}` : '';
    return `• ${i.name} | ${i.size} | ${i.sweetness}${addonStr}${qty} — ${formatPrice(
      i.totalPrice * i.quantity
    )}`;
  });

  const total = items.reduce((sum, i) => sum + i.totalPrice * i.quantity, 0);

  return [
    'Xin chào Bánh Cá Bốn Mùa! 🐟',
    'Mình muốn đặt:',
    '',
    ...lines,
    '',
    `Tổng: ${formatPrice(total)}`,
    'Mình có thể thanh toán khi nhận hàng nhé!',
    '---',
    'Cảm ơn ạ!',
  ].join('\n');
};
