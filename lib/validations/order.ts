import { z } from "zod";

const sweetnessEnum = z.enum(["NONE", "QUARTER", "HALF", "THREE_QUARTER", "FULL"]);
const sizeEnum = z.enum(["M", "L", "XL"]);

/** Schema for a single item line in a staff order. */
export const staffOrderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  size: sizeEnum.optional(),
  sweetness: sweetnessEnum,
  note: z.string().max(500).optional(),
  addon_option_ids: z
    .array(
      z.object({
        option_id: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .default([]),
  product_voucher_id: z.string().uuid().optional(),
});

/** Schema for the full staff counter order payload. */
export const staffOrderSchema = z.object({
  phone_number: z.string().regex(/^(0|\+84)\d{9}$/),
  customer_name: z.string().min(1).max(100).optional(),
  items: z.array(staffOrderItemSchema).min(1),
  voucher_id: z.string().uuid().optional(),
});

export type StaffOrderItem = z.infer<typeof staffOrderItemSchema>;
export type StaffOrderInput = z.infer<typeof staffOrderSchema>;
