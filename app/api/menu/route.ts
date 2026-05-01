import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  MenuData,
  MenuItem,
  Addon,
  AddonOption,
} from "@/src/lib/types/menu";

/** Default ml values per size if description parsing fails */
const SIZE_ML_DEFAULTS: Record<"M" | "L" | "XL", number> = {
  M: 360,
  L: 500,
  XL: 700,
};

/** Parse ml from a description like "Some text | 360ml" */
function parseMlFromDescription(desc: string | null): number | null {
  if (!desc) return null;
  const match = desc.match(/\|\s*(\d+)\s*ml\s*$/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Strip size suffix from a daily item name: "Meyumi (M)" → "Meyumi" */
function stripSizeSuffix(name: string): string {
  return name.replace(/\s+\([MXL]{1,2}\)\s*$/, "").trim();
}

/** Derive tag label from category string */
function categoryToTag(category: string): string {
  if (category === "daily") return "Hằng ngày";
  if (category === "seasonal") return "Theo mùa";
  if (category === "recipe") return "Công thức";
  return category;
}

/** Convert VND integer to 🐟 cá units (1 cá = 1,000 VND) */
function vndToCa(vnd: number): number {
  return Math.round(vnd / 1000);
}

/** GET /api/menu — public, no auth required */
export async function GET() {
  try {
    // Fetch all available menu items ordered by sort_order
    const rawItems = await prisma.menuItem.findMany({
      where: { is_available: true },
      orderBy: { sort_order: "asc" },
    });

    // Fetch all addon groups with their options
    const rawAddonGroups = await prisma.addonGroup.findMany({
      include: {
        options: {
          orderBy: { sort_order: "asc" },
        },
      },
    });

    // ── Transform addon groups ────────────────────────────────────────────────
    const addons: Addon[] = rawAddonGroups.map((group) => {
      const isMilkSelector = group.name === "Loại sữa";
      const isToggle = group.type === "TOGGLE";

      // For TOGGLE: surface the single option's price in cá units at top level; null otherwise
      const togglePrice: number | null =
        isToggle && group.options.length > 0
          ? vndToCa(group.options[0].price_vnd)
          : null;

      // For SELECTOR / QUANTITY / milk_selector: include options array
      const options: AddonOption[] | null =
        !isToggle
          ? group.options.map((opt) => ({
            id: opt.id,
            label: opt.label,
            price: vndToCa(opt.price_vnd),
            is_default: opt.is_default,
          }))
          : null;

      return {
        id: group.id,
        name: group.name,
        type: isMilkSelector ? "milk_selector" : group.type,
        price: togglePrice,
        description: group.description ?? null,
        is_required: group.is_required,
        min_quantity: group.min_quantity ?? null,
        max_quantity: group.max_quantity ?? null,
        options,
      };
    });

    // ── Separate daily items from seasonal/recipe ─────────────────────────────
    const dailyRaw = rawItems.filter((i) => i.category === "daily");
    const nonDailyRaw = rawItems.filter((i) => i.category !== "daily");

    // ── Group daily items by base name ────────────────────────────────────────
    type SizeKey = "M" | "L" | "XL";
    const dailyMap = new Map<
      string,
      {
        rows: typeof dailyRaw;
        sizes: Partial<Record<SizeKey, { price: number; ml: number }>>;
        baseRow: (typeof dailyRaw)[0] | null;
      }
    >();

    for (const item of dailyRaw) {
      const baseName = stripSizeSuffix(item.name);
      const sizeMatch = item.name.match(/\(([MXL]{1,2})\)\s*$/);
      const sizeKey = sizeMatch ? (sizeMatch[1] as SizeKey) : null;

      if (!dailyMap.has(baseName)) {
        dailyMap.set(baseName, { rows: [], sizes: {}, baseRow: null });
      }
      const entry = dailyMap.get(baseName)!;
      entry.rows.push(item);

      if (sizeKey) {
        const ml =
          parseMlFromDescription(item.description) ??
          SIZE_ML_DEFAULTS[sizeKey];
        entry.sizes[sizeKey] = { price: vndToCa(item.price_vnd), ml };
      }

      // Use M row as the canonical row; fallback to first row
      if (sizeKey === "M" || entry.baseRow === null) {
        entry.baseRow = item;
      }
    }

    const daily: MenuItem[] = [];
    for (const [baseName, { baseRow, sizes }] of dailyMap.entries()) {
      if (!baseRow) continue;

      // Ensure all three sizes exist; use defaults for any missing
      const M = sizes["M"] ?? { price: vndToCa(baseRow.price_vnd), ml: SIZE_ML_DEFAULTS.M };
      const L = sizes["L"] ?? { price: vndToCa(baseRow.price_vnd), ml: SIZE_ML_DEFAULTS.L };
      const XL = sizes["XL"] ?? { price: vndToCa(baseRow.price_vnd), ml: SIZE_ML_DEFAULTS.XL };

      daily.push({
        id: baseRow.id,
        name: baseName,
        description: baseRow.description ?? null,
        image: baseRow.image_url ?? null,
        category: "daily",
        tags: [categoryToTag("daily")],
        type: "daily",
        price: null,
        sizes: { M, L, XL },
      });
    }

    // ── Transform seasonal and recipe items ───────────────────────────────────
    const seasonal: MenuItem[] = [];
    const recipe: MenuItem[] = [];

    for (const item of nonDailyRaw) {
      const cat = item.category as "seasonal" | "recipe";
      const transformed: MenuItem = {
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        image: item.image_url ?? null,
        category: cat,
        tags: [categoryToTag(cat)],
        type: cat,
        price: vndToCa(item.price_vnd),
        sizes: null,
      };
      if (cat === "seasonal") {
        seasonal.push(transformed);
      } else {
        recipe.push(transformed);
      }
    }

    const menuData: MenuData = { daily, seasonal, recipe, addons };

    return NextResponse.json({ data: menuData });
  } catch (error) {
    console.error("[GET /api/menu] Database error, falling back to static JSON:", error);
    
    try {
      // Fallback to static menu.json if DB is down
      const fs = require('fs/promises');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'data', 'menu.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const staticData = JSON.parse(fileContent);

      // Transform static data to match MenuData schema
      const fallbackData: MenuData = {
        daily: (staticData.daily || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || null,
          image: item.image || null,
          category: 'daily',
          tags: ['Hằng ngày'],
          type: 'daily',
          price: null,
          sizes: item.sizes || null,
        })),
        seasonal: (staticData.seasonal || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || null,
          image: item.image || null,
          category: 'seasonal',
          tags: ['Theo mùa'],
          type: 'seasonal',
          price: item.price || 0,
          sizes: null,
        })),
        recipe: [], 
        addons: (staticData.addons || []).map((addon: any) => {
          const type = addon.name === 'Loại sữa' ? 'milk_selector' : (addon.type || (addon.price ? 'TOGGLE' : 'SELECTOR'));
          return {
            id: addon.id,
            name: addon.name,
            type: type,
            price: addon.price || null,
            description: addon.description || null,
            is_required: addon.name === 'Loại sữa',
            min_quantity: null,
            max_quantity: null,
            options: addon.options ? addon.options.map((opt: any, idx: number) => ({
              id: `${addon.id}-opt-${idx}`,
              label: opt.label,
              price: opt.price || 0,
              is_default: opt.default || false,
            })) : null,
          };
        }),
      };

      return NextResponse.json({ data: fallbackData });
    } catch (fallbackError) {
      console.error("[GET /api/menu] Fallback error:", fallbackError);
      return NextResponse.json(
        { error: "Failed to fetch menu", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
}
