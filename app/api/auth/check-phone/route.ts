import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/auth";

const QuerySchema = z.object({
  phone: z
    .string()
    .regex(/^(0|\+84)\d{9}$/, "Số điện thoại không hợp lệ"),
});

/**
 * GET /api/auth/check-phone?phone=0912345678
 * Returns { available: boolean } — true if the number is not yet registered.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ phone: searchParams.get("phone") });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizePhone(parsed.data.phone);

  const existing = await prisma.user.findUnique({
    where: { phone_number: normalizedPhone },
    select: { id: true },
  });

  return NextResponse.json({ data: { exists: existing !== null } }, { status: 200 });
}
