// Pricing and volume details per size
export interface SizeDetail {
  price: number;
  ml: number;
}

// A single menu item — works for daily, seasonal, and recipe categories
export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  category: "daily" | "seasonal" | "recipe";
  /** Human-readable category labels, e.g. ['Hằng ngày'] */
  tags: string[];
  type: "daily" | "seasonal" | "recipe";
  /** Flat price for seasonal and recipe items; null for daily (use sizes instead) */
  price: number | null;
  /** Size variants for daily items only; null for seasonal and recipe */
  sizes: {
    M: SizeDetail;
    L: SizeDetail;
    XL: SizeDetail;
  } | null;
}

// An option within a SELECTOR or QUANTITY addon group
export interface AddonOption {
  id: string;
  label: string;
  /** Price in VND (integer) */
  price: number;
  is_default: boolean;
}

// An addon group returned by the API
export interface Addon {
  id: string;
  name: string;
  /** 'milk_selector' is a special SELECTOR for "Loại sữa" — rendered as a radio row */
  type: "SELECTOR" | "TOGGLE" | "QUANTITY" | "milk_selector";
  /** For TOGGLE addons: the single option's price in VND; null for all other types */
  price: number | null;
  description: string | null;
  is_required: boolean;
  min_quantity: number | null;
  max_quantity: number | null;
  /** For SELECTOR, QUANTITY, and milk_selector: the list of options; null for TOGGLE */
  options: AddonOption[] | null;
}

// The complete menu structure returned by GET /api/menu
export interface MenuData {
  daily: MenuItem[];
  seasonal: MenuItem[];
  recipe: MenuItem[];
  addons: Addon[];
}
