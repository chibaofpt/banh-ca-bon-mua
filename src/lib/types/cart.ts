// Cart types — will be expanded when cart feature is fully implemented
export interface CartItem {
  id: string;
  name: string;
  size: string;        // "Cá Con" | "Cá Vừa" | "Cá Lớn" | "Một size"
  ml: number;
  sweetness: string;
  addons: string[];
  basePrice: number;
  addonsPrice: number;
  totalPrice: number;  // basePrice + addonsPrice
  quantity: number;
}

export interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, size: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}
