import { z } from "zod";

const sizeSchema = z.object({
  size: z.enum(["M", "L", "XL"]),
  base_price_vnd: z.number().int().min(0).nullable(),
});

const customPowderGramsSchema = z
  .object({
    M: z.number().positive().optional(),
    L: z.number().positive().optional(),
    XL: z.number().positive().optional(),
  })
  .nullable()
  .optional();

/** Validates that sizes array has exactly 3 rows covering M, L, XL. */
const sizesSchema = z
  .array(sizeSchema)
  .length(3)
  .refine(
    (sizes) => {
      const keys = new Set(sizes.map((s) => s.size));
      return keys.has("M") && keys.has("L") && keys.has("XL");
    },
    { message: "Phải có đủ 3 size M, L, XL" }
  );

const baseMenuSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên món"),
  description: z.string().optional().nullable(),
  is_available: z.boolean().default(true),
  is_seasonal: z.boolean().default(false),
  image_url: z.string().url().optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  sizes: sizesSchema,
  custom_powder_grams: customPowderGramsSchema,
});

export const createLatteMenuSchema = baseMenuSchema.extend({
  category: z.literal("latte"),
  matcha_powder_id: z.string().uuid("matcha_powder_id phải là UUID hợp lệ").optional().nullable(),
});

export const createFusionMenuSchema = baseMenuSchema.extend({
  category: z.literal("fusion"),
  default_powder_id: z.string().uuid("default_powder_id phải là UUID hợp lệ").optional().nullable(),
  base_liquid_note: z.string().max(200).optional().nullable(),
});

export const createMenuSchema = z.discriminatedUnion("category", [
  createLatteMenuSchema,
  createFusionMenuSchema,
]);

export const updateMenuSchema = createMenuSchema
  .unwrap()
  .partial()
  .and(z.object({ category: z.enum(["latte", "fusion"]) }));

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
