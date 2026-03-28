// Metadata for contact channels
export interface ContactData {
  zalo: string;
  instagram: string;
  threads: string;
}

// Pricing and volume details per size
export interface SizeDetail {
  ml: number;
  price: number;
}

// Items available daily (typically drinks with size options)
export interface DailyItem {
  id: string;
  name: string;
  description: string;
  image: string;
  likes: number;
  sizes: {
    M: SizeDetail;
    L: SizeDetail;
    XL: SizeDetail;
  };
  type: 'daily';
  tags: string[];
}

// Special items available only during specific seasons
export interface SeasonalItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  likes: number;
  type: 'seasonal';
  tags: string[];
}

// Union type for all menu items
export type MenuItem = DailyItem | SeasonalItem;

// Toppings or extras added to a main item
export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  pricePerGram?: number;
  maxGrams?: number;
  image: string;
  type?: string;
  options?: { label: string; price: number; default?: boolean }[];
}

// The complete menu structure as fetched from menu.json
export interface MenuData {
  contact: ContactData;
  daily: DailyItem[];
  seasonal: SeasonalItem[];
  addons: Addon[];
}
