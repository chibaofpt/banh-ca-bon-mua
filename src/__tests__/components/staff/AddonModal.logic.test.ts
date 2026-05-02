import { describe, it, expect } from "vitest";
import type { MenuItem, AddonGroup } from "@/src/lib/types/menu";

// ── Pure price calculation logic mirroring AddonModal ───────────────────────

/** Mirror calcUnitPrice logic từ AddonModal */
function calcUnitPrice(
  item: MenuItem,
  selectedSize: "M" | "L" | "XL" | null,
  selectedOptionIds: string[],
  quantityMap: Record<string, number>
): number {
  const base =
    item.category === "daily"
      ? (item.sizes.find((s) => s.size === selectedSize)?.price_vnd ?? 0)
      : (item.price_vnd ?? 0);

  const addonsCost = item.addon_groups
    .flatMap((g) => {
      if (g.type === "QUANTITY") {
        const qty = quantityMap[g.id] ?? 0;
        return qty > 0 ? [qty * (g.options[0]?.price_vnd ?? 0)] : [];
      }
      return g.options
        .filter((o) => selectedOptionIds.includes(o.id))
        .map((o) => o.price_vnd);
    })
    .reduce((s, v) => s + v, 0);

  return base + addonsCost;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const quantityGroup: AddonGroup = {
  id: "grp-powder",
  name: "Extra Powder",
  type: "QUANTITY",
  is_required: false,
  min_quantity: 0,
  max_quantity: 3,
  options: [
    {
      id: "opt-powder",
      label: "Bột matcha",
      price_vnd: 5000,
      is_default: false,
      sort_order: 0,
    },
  ],
};

const selectorGroup: AddonGroup = {
  id: "grp-milk",
  name: "Loại sữa",
  type: "SELECTOR",
  is_required: true,
  min_quantity: null,
  max_quantity: null,
  options: [
    { id: "opt-cow", label: "Sữa bò", price_vnd: 0, is_default: true, sort_order: 0 },
    { id: "opt-oat", label: "Sữa Oat", price_vnd: 10000, is_default: false, sort_order: 1 },
  ],
};

const dailyItem: MenuItem = {
  id: "item-matcha",
  name: "Matcha Latte",
  description: null,
  category: "daily",
  price_vnd: null,
  image_url: null,
  sort_order: 0,
  sizes: [
    { size: "M", price_vnd: 45000 },
    { size: "L", price_vnd: 55000 },
    { size: "XL", price_vnd: 65000 },
  ],
  addon_groups: [selectorGroup, quantityGroup],
};

const seasonalItem: MenuItem = {
  id: "item-hong-tra",
  name: "Hồng Trà",
  description: null,
  category: "seasonal",
  price_vnd: 60000,
  image_url: null,
  sort_order: 1,
  sizes: [],
  addon_groups: [selectorGroup],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("calcUnitPrice — daily item", () => {
  it("default size L, không addon → 55000", () => {
    expect(calcUnitPrice(dailyItem, "L", ["opt-cow"], {})).toBe(55000);
  });

  it("size M → 45000", () => {
    expect(calcUnitPrice(dailyItem, "M", ["opt-cow"], {})).toBe(45000);
  });

  it("size XL + sữa Oat → 65000 + 10000 = 75000", () => {
    expect(calcUnitPrice(dailyItem, "XL", ["opt-oat"], {})).toBe(75000);
  });

  it("size L + 2g bột → 55000 + 2×5000 = 65000", () => {
    expect(calcUnitPrice(dailyItem, "L", ["opt-cow"], { "grp-powder": 2 })).toBe(65000);
  });

  it("size L + 3g bột (max) + sữa Oat → 55000 + 15000 + 10000 = 80000", () => {
    expect(calcUnitPrice(dailyItem, "L", ["opt-oat"], { "grp-powder": 3 })).toBe(80000);
  });

  it("bột qty = 0 → không tính addon cost", () => {
    expect(calcUnitPrice(dailyItem, "L", ["opt-cow"], { "grp-powder": 0 })).toBe(55000);
  });

  it("selectedSize null → base = 0 (guard case)", () => {
    expect(calcUnitPrice(dailyItem, null, [], {})).toBe(0);
  });
});

describe("calcUnitPrice — seasonal item", () => {
  it("không addon → 60000", () => {
    expect(calcUnitPrice(seasonalItem, null, ["opt-cow"], {})).toBe(60000);
  });

  it("sữa Oat → 60000 + 10000 = 70000", () => {
    expect(calcUnitPrice(seasonalItem, null, ["opt-oat"], {})).toBe(70000);
  });

  it("sizes không ảnh hưởng seasonal item", () => {
    expect(calcUnitPrice(seasonalItem, "L", ["opt-cow"], {})).toBe(60000);
  });
});

describe("QUANTITY addon logic", () => {
  it("chỉ tính qty > 0", () => {
    const withZero = calcUnitPrice(dailyItem, "L", ["opt-cow"], { "grp-powder": 0 });
    const withOne = calcUnitPrice(dailyItem, "L", ["opt-cow"], { "grp-powder": 1 });
    expect(withOne - withZero).toBe(5000);
  });

  it("group không có trong quantityMap → bỏ qua (không crash)", () => {
    expect(() => calcUnitPrice(dailyItem, "L", ["opt-cow"], {})).not.toThrow();
  });
});

describe("SELECTOR addon logic", () => {
  it("chọn sữa Oat thay sữa bò → chỉ tính 1 option", () => {
    const priceWithOat = calcUnitPrice(dailyItem, "L", ["opt-oat"], {});
    const priceWithCow = calcUnitPrice(dailyItem, "L", ["opt-cow"], {});
    expect(priceWithOat - priceWithCow).toBe(10000);
  });
});
