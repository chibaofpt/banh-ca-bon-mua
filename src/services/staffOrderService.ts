import { apiClient } from "@/src/lib/api/client";
import type { ApiResponse } from "@/src/lib/types/api";
import type { SweetnessLevel } from "@/src/lib/types/menu";

// ── Types ───────────────────────────────────────────────────────────────────

export interface CreateStaffOrderPayload {
  phone_number: string;
  customer_name?: string;
  items: {
    menu_item_id: string;
    quantity: number;
    size?: "M" | "L" | "XL";
    sweetness: SweetnessLevel;
    note?: string;
    addon_option_ids: { option_id: string; quantity: number }[];
    product_voucher_id?: string;
  }[];
  voucher_id?: string;
}

export type QrScanResult =
  | {
      type: "user";
      data: {
        id: string;
        name: string;
        phone_number: string;
        points_balance: number;
      };
    }
  | {
      type: "voucher";
      data: {
        id: string;
        voucher_type: "DISCOUNT" | "PRODUCT";
        discount_type: "PERCENT" | "FIXED" | null;
        discount_value: number | null;
        menu_item_id: string | null;
        status: "ACTIVE" | "REDEEMED" | "EXPIRED";
        expires_at: string | null;
      };
    };

type PhoneLookupResult =
  | { found: true; name: string; phone_number: string }
  | { found: false };

// ── Service ─────────────────────────────────────────────────────────────────

const URLS = {
  users: "/api/staff/users",
  orders: "/api/staff/orders",
  scan: "/api/staff/scan",
  redeemVoucher: (qrToken: string) => `/api/staff/vouchers/${qrToken}/redeem`,
} as const;

/**
 * Lookup customer by phone number — returns found status and name if found.
 */
export async function lookupPhone(phone: string): Promise<PhoneLookupResult> {
  const res = await apiClient.get<ApiResponse<PhoneLookupResult>>(URLS.users, {
    params: { phone },
  });
  return res.data.data;
}

/**
 * Create a counter order. Ghost user creation is handled server-side.
 */
export async function createStaffOrder(
  payload: CreateStaffOrderPayload
): Promise<void> {
  await apiClient.post(URLS.orders, payload);
}

/**
 * Resolve a QR token — returns user info or voucher info.
 */
export async function scanQrToken(token: string): Promise<QrScanResult> {
  const res = await apiClient.get<ApiResponse<QrScanResult>>(URLS.scan, {
    params: { token },
  });
  return res.data.data;
}

/**
 * Mark a voucher as REDEEMED offline via its QR token.
 */
export async function redeemVoucher(qrToken: string): Promise<void> {
  await apiClient.patch(URLS.redeemVoucher(qrToken));
}
