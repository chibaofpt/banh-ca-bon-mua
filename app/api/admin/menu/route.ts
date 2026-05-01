import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/menu — returns all menu items including unavailable ones. ADMIN only. */
export async function GET(): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { sort_order: "asc" }],
    });

    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    console.error("[GET /api/admin/menu]", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
