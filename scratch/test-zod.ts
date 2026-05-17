import { updateMenuSchema } from "./lib/validations/menu";

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
