export type SweetnessLevel =
  | "NONE"
  | "QUARTER"
  | "HALF"
  | "THREE_QUARTER"
  | "FULL";

export type Size = "M" | "L" | "XL";

export interface MenuItemSize {
  size: "M" | "L" | "XL";
  price_vnd: number;
}

export interface AddonOption {
  id: string;
  label: string;
  price_vnd: number;
  is_default: boolean;
  sort_order: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  type: "SELECTOR" | "TOGGLE" | "QUANTITY";
  is_required: boolean;
  min_quantity: number | null;
  max_quantity: number | null;
  options: AddonOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: "daily" | "seasonal" | "recipe";
  /** Null for daily items — use sizes instead. Non-null for seasonal/recipe. */
  price_vnd: number | null;
  image_url: string | null;
  sort_order: number;
  /** Non-empty only for daily items (always M, L, XL); empty array for seasonal/recipe. */
  sizes: MenuItemSize[];
  addon_groups: AddonGroup[];
}

/** The complete menu structure returned by GET /api/menu, grouped by category. */
export interface MenuData {
  [category: string]: MenuItem[];
}
