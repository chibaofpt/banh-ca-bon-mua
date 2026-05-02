import type { SweetnessLevel } from "./menu";

export interface CartItem {
  /** Unique cart row id — crypto.randomUUID() when added. */
  cartId: string;
  menuItemId: string;
  name: string;
  category: "daily" | "seasonal" | "recipe";
  imageUrl: string | null;
  /** Null for seasonal/recipe; M/L/XL for daily. */
  size: "M" | "L" | "XL" | null;
  /** Snapshot VND at add time: base price + addons price. Never changes after add. */
  unitPrice: number;
  /** Default 1, adjustable in CartDrawer (min 1). */
  quantity: number;
  sweetness: SweetnessLevel;
  note: string;
  /** Option ids for SELECTOR and TOGGLE addon groups. */
  selectedOptionIds: string[];
  /** { [addon_group.id]: qty } for QUANTITY groups. Kept for display only. */
  quantityMap: Record<string, number>;
  /** Total addon cost snapshot in VND. */
  addonsPrice: number;
  /** Resolved QUANTITY addon options (option_id + qty > 0 only). Sent directly to API. */
  quantityAddonOptions: { option_id: string; quantity: number }[];
  /** Set when this item was added via a PRODUCT voucher scan (unit price = 0). */
  productVoucherId?: string;
}
