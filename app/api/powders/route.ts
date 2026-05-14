import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PowderApiResponse } from "@/src/lib/types/powder";

/** GET /api/powders — public, no auth required. */
export async function GET(): Promise<NextResponse> {
  try {
    const [powders, defaultSizeConfigs] = await Promise.all([
      prisma.matchaPowder.findMany({
        where: { is_available: true },
        orderBy: { name: "asc" },
        include: {
          powderSizeConfigs: true,
        },
      }),
      prisma.defaultSizeConfig.findMany(),
    ]);

    const response: PowderApiResponse = {
      data: powders.map((p) => ({
        id: p.id,
        name: p.name,
        manufacturer: p.manufacturer ?? null,
        description: p.description ?? null,
        price_per_gram: p.price_per_gram,
        type: p.type,
        fragrance: p.fragrance ?? null,
        body: p.body ?? null,
        bitterness: p.bitterness ?? null,
        umami: p.umami ?? null,
        color: p.color ?? null,
        is_available: p.is_available,
        size_config: p.powderSizeConfigs.map((c) => ({
          size: c.size,
          grams: Number(c.grams),
        })),
      })),
      default_powder_gram: defaultSizeConfigs.map((c) => ({
        size: c.size,
        grams: Number(c.powder_gram),
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET /api/powders]", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
