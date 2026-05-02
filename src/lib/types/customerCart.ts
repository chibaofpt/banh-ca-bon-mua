/** Customer-facing cart item — used by Zustand store and customer menu page. */
export type CustomerSweetnessValue = "Lat" | "It ngot" | "Vua" | "Ngot" | "Rat ngot";

export interface CustomerCartItem {
  id: string;
  name: string;
  /** Display label: "Ca Con" | "Ca Vua" | "Ca Lon" | "Mot size" */
  size: string;
  ml: number;
  sweetness: CustomerSweetnessValue;
  addons: string[];
  basePrice: number;
  addonsPrice: number;
  totalPrice: number;
  quantity: number;
}

export interface CustomerCartStore {
  items: CustomerCartItem[];
  addItem: (item: Omit<CustomerCartItem, "quantity">) => void;
  removeItem: (id: string, size: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}
