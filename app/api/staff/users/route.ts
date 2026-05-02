import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, normalizePhone } from "@/lib/auth";

const staffUsersQuerySchema = z.object({
  phone: z.string().min(1),
});

/** GET /api/staff/users?phone=xxx — lookup customer by phone, STAFF or ADMIN only */
export async function GET(req: NextRequest) {
  // 1. Parse input
  const { searchParams } = new URL(req.url);
  const rawPhone = searchParams.get("phone") ?? "";

  // 2. Zod validate
  const parsed = staffUsersQuerySchema.safeParse({ phone: rawPhone });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid phone param", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // 3. Session check
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // 4. Role check
  if (!["STAFF", "ADMIN"].includes(session.role)) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // 5. Business logic
  try {
    const normalizedPhone = normalizePhone(parsed.data.phone);

    const user = await prisma.user.findUnique({
      where: { phone_number: normalizedPhone },
      select: { name: true, phone_number: true },
    });

    if (!user) {
      return NextResponse.json({ data: { found: false } }, { status: 200 });
    }

    return NextResponse.json(
      { data: { found: true, name: user.name, phone_number: user.phone_number } },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/staff/users]", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
