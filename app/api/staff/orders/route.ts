import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession, normalizePhone } from "@/lib/auth";
import { staffOrderSchema } from "@/lib/validations/order";
import { buildPricingContext, resolveOrderItemPrice, resolveOrderItemPremiumLatte } from "@/lib/pricing";
import type { Size, SweetnessLevel } from "@/src/lib/types/menu";

/** POST /api/staff/orders — create a counter order (status = COMPLETED immediately) */
export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // 2. Zod validate
  const parsed = staffOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed", code: "VALIDATION_ERROR" },
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

  // 5. Business logic — everything inside a single transaction
  try {
    const data = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      // 0. Pre-load pricing context for entire order
      const pricingCtx = await buildPricingContext(tx);

      // ── Step 1: Normalize phone + resolve/create user ────────────────────────
      const normalizedPhone = normalizePhone(data.phone_number);

      let user = await tx.user.findUnique({
        where: { phone_number: normalizedPhone },
      });

      if (!user) {
        if (!data.customer_name) {
          throw new Error("CUSTOMER_NAME_REQUIRED");
        }
        user = await tx.user.create({
          data: {
            phone_number: normalizedPhone,
            name: data.customer_name,
            password_hash: "GHOST_USER_NO_PASSWORD",
            role: "CUSTOMER",
            qr_token: crypto.randomUUID(),
          },
        });
      }

      // ── Step 2: Validate items + re-fetch prices from DB ─────────────────────
      const priceConflicts: any[] = [];

      const resolvedItems = await Promise.all(
        data.items.map(async (item) => {
          const menuItem = await tx.menuItem.findUnique({
            where: { id: item.menu_item_id },
            include: { sizes: true },
          });

          if (!menuItem || !menuItem.is_available) {
            throw new Error(`ITEM_NOT_FOUND:${item.menu_item_id}`);
          }

          const sizeRow = menuItem.sizes.find((s) => s.size === item.size);
          if (!sizeRow || sizeRow.base_price_vnd === null) {
            throw new Error(`SIZE_NOT_AVAILABLE:${item.menu_item_id}`);
          }

          // Resolve powder_id and premium_latte
          let powder_id: string;
          let premium_latte = 0;

          if (menuItem.category === "latte") {
            if (!menuItem.matcha_powder_id) throw new Error(`POWDER_MISSING_FOR_LATTE:${item.menu_item_id}`);
            powder_id = menuItem.matcha_powder_id;
          } else {
            // Fusion
            powder_id = item.selected_powder_id || menuItem.default_powder_id || "";
            if (powder_id && menuItem.default_powder_id) {
              premium_latte = await resolveOrderItemPremiumLatte(
                powder_id,
                menuItem.default_powder_id,
                item.size,
                tx
              );
            }
          }

          // Compute server-authoritative unit price
          const unit_price_vnd = resolveOrderItemPrice(
            {
              category: menuItem.category as "latte" | "fusion",
              size: item.size,
              base_price_vnd: sizeRow.base_price_vnd,
              custom_powder_grams: menuItem.custom_powder_grams as any,
              powder_id,
              milk_type_id: item.selected_milk_type_id,
              premium_latte,
            },
            pricingCtx
          );

          // PRODUCT voucher → unit_price_vnd = 0 (addons still charged)
          const final_unit_price_vnd = item.product_voucher_id ? 0 : unit_price_vnd;

          // PRICE_CHANGED validation
          if (item.client_price_vnd !== final_unit_price_vnd) {
            priceConflicts.push({
              menu_item_id: item.menu_item_id,
              expected: final_unit_price_vnd,
              received: item.client_price_vnd,
            });
          }

          // Re-fetch addon prices — snapshot at order time
          let addons_price_vnd = 0;
          const resolvedAddons: {
            addon_option_id: string;
            quantity: number;
            unit_price_vnd: number;
          }[] = [];

          for (const addon of item.addon_option_ids) {
            const option = await tx.addonOption.findUnique({
              where: { id: addon.option_id },
            });
            if (!option) throw new Error(`ADDON_NOT_FOUND:${addon.option_id}`);
            const addonCost = option.price_vnd * addon.quantity;
            addons_price_vnd += addonCost;
            resolvedAddons.push({
              addon_option_id: option.id,
              quantity: addon.quantity,
              unit_price_vnd: option.price_vnd,
            });
          }

          const line_total = (final_unit_price_vnd + addons_price_vnd) * item.quantity;

          return {
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            size: item.size,
            unit_price_vnd: final_unit_price_vnd,
            addons_price_vnd,
            line_total,
            sweetness: item.sweetness as SweetnessLevel,
            note: item.note ?? null,
            product_voucher_id: item.product_voucher_id ?? null,
            resolvedAddons,
            selected_powder_id: powder_id,
            selected_milk_type_id: item.selected_milk_type_id ?? null,
          };
        })
      );

      // Rejection on price mismatch
      if (priceConflicts.length > 0) {
        throw new Error(`PRICE_CHANGED:${JSON.stringify(priceConflicts)}`);
      }

      const subtotal_vnd = resolvedItems.reduce((sum, item) => sum + item.line_total, 0);
      let discount_vnd = 0;
      let voucher_id: string | null = null;

      if (data.voucher_id) {
        const voucher = await tx.voucher.findUnique({
          where: { id: data.voucher_id },
        });

        if (voucher && voucher.status === "ACTIVE" && voucher.voucher_type === "DISCOUNT") {
          voucher_id = voucher.id;
          if (voucher.discount_type === "PERCENT" && voucher.discount_value !== null) {
            discount_vnd = Math.floor((subtotal_vnd * voucher.discount_value) / 100);
          } else if (voucher.discount_type === "FIXED" && voucher.discount_value !== null) {
            discount_vnd = voucher.discount_value;
          }
        }
      }

      const total_vnd = Math.max(0, subtotal_vnd - discount_vnd);
      const points_earned = Math.floor(total_vnd / 10000);

      // ── Step 4: Create order + items + addons ─────────────────────────────────
      const createdOrder = await tx.order.create({
        data: {
          user_id: user.id,
          voucher_id,
          status: "COMPLETED",         // staff counter order → COMPLETED immediately
          subtotal_vnd,
          discount_vnd,
          total_vnd,
          points_earned,
          pickup_time: null,
          note: null,
          items: {
            create: resolvedItems.map((item) => ({
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              size: item.size,
              unit_price_vnd: item.unit_price_vnd,
              addons_price_vnd: item.addons_price_vnd,
              sweetness: item.sweetness,
              note: item.note,
              product_voucher_id: item.product_voucher_id,
              selected_powder_id: item.selected_powder_id,
              selected_milk_type_id: item.selected_milk_type_id,
              addons: {
                create: item.resolvedAddons.map((a) => ({
                  addon_option_id: a.addon_option_id,
                  quantity: a.quantity,
                  unit_price_vnd: a.unit_price_vnd,
                })),
              },
            })),
          },
        },
      });

      // Update user points balance
      await tx.user.update({
        where: { id: user.id },
        data: { points_balance: { increment: points_earned } },
      });

      // Insert points_log — immutable audit trail, only if points were earned
      if (points_earned > 0) {
        await tx.pointsLog.create({
          data: {
            user_id: user.id,
            delta: points_earned,
            reason: "order_complete",
            order_id: createdOrder.id,
            performed_by: null,
            voucher_id: null,
          },
        });
      }

      return createdOrder;
    });

    // 6. Return success — do NOT expose users.id
    return NextResponse.json(
      {
        data: {
          id: order.id,
          status: order.status,
          total_vnd: order.total_vnd,
          points_earned: order.points_earned,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";

    if (msg === "CUSTOMER_NAME_REQUIRED") {
      return NextResponse.json(
        { error: "customer_name required for new phone", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (msg.startsWith("ITEM_NOT_FOUND") || msg.startsWith("SIZE_NOT_FOUND")) {
      return NextResponse.json(
        { error: "Menu item not found or unavailable", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (msg.startsWith("SIZE_REQUIRED") || msg.startsWith("SIZE_NOT_ALLOWED") || msg.startsWith("SIZE_NOT_AVAILABLE")) {
      return NextResponse.json(
        { error: "Size validation failed", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (msg.startsWith("PRICE_CHANGED")) {
      const conflicts = JSON.parse(msg.split(":")[1] || "[]");
      return NextResponse.json(
        { error: "Price has changed", code: "PRICE_CHANGED", details: { conflicts } },
        { status: 409 }
      );
    }
    if (msg.startsWith("ADDON_NOT_FOUND")) {
      return NextResponse.json(
        { error: "Addon option not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    console.error("[POST /api/staff/orders]", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
