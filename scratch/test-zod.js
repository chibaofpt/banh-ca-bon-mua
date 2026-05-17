const { z } = require("zod");

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

const updateMenuSchema = z.object({
  category: z.enum(["latte", "fusion"]).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  is_available: z.boolean().optional(),
  is_seasonal: z.boolean().optional(),
  image_url: z.string().url().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
  sizes: sizesSchema.optional(),
  custom_powder_grams: customPowderGramsSchema,
  matcha_powder_id: z.string().uuid().optional().nullable(),
  default_powder_id: z.string().uuid().optional().nullable(),
  base_liquid_note: z.string().max(200).optional().nullable(),
  allowed_powder_ids: z.array(z.string().uuid()).optional(),
});

const raw = {
  name: "Latte Test",
  description: undefined,
  is_seasonal: false,
  is_available: true,
  sort_order: 0,
  matcha_powder_id: undefined,
  default_powder_id: undefined,
  base_liquid_note: undefined,
  sizes: [
    { size: "M", base_price_vnd: 45000 },
    { size: "L", base_price_vnd: 55000 },
    { size: "XL", base_price_vnd: null }
  ],
  custom_powder_grams: undefined,
  allowed_powder_ids: undefined,
};

const validation = updateMenuSchema.safeParse(raw);
console.log(JSON.stringify(validation, null, 2));
