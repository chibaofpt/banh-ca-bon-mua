import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/menu — public, no auth required */
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      where: { is_available: true },
      orderBy: { sort_order: "asc" },
      include: {
        sizes: {
          orderBy: { size: "asc" },
        },
        addon_groups: {
          include: {
            addon_group: {
              include: {
                options: { orderBy: { sort_order: "asc" } },
              },
            },
          },
        },
      },
    });

    // ── Group by category ──────────────────────────────────────────────────────
    const grouped: Record<string, unknown[]> = {};

    for (const item of items) {
      const cat = item.category;
      if (!grouped[cat]) grouped[cat] = [];

      grouped[cat].push({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        price_vnd: item.price_vnd ?? null,
        image_url: item.image_url ?? null,
        sort_order: item.sort_order,
        sizes: item.sizes.map((s) => ({
          size: s.size,
          price_vnd: s.price_vnd,
        })),
        addon_groups: item.addon_groups.map(({ addon_group: g }) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          is_required: g.is_required,
          min_quantity: g.min_quantity ?? null,
          max_quantity: g.max_quantity ?? null,
          options: g.options.map((o) => ({
            id: o.id,
            label: o.label,
            price_vnd: o.price_vnd,
            is_default: o.is_default,
            sort_order: o.sort_order,
          })),
        })),
      });
    }

    return NextResponse.json({ data: grouped });
  } catch (error) {
    console.error("[GET /api/menu] Database error, falling back to static JSON:", error);

    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "public", "data", "menu.json");
      const fileContent = await fs.readFile(filePath, "utf-8");
      const staticData = JSON.parse(fileContent) as Record<string, unknown>;

      return NextResponse.json({ data: staticData });
    } catch (fallbackError) {
      console.error("[GET /api/menu] Fallback error:", fallbackError);
      return NextResponse.json(
        { error: "Failed to fetch menu", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
}
