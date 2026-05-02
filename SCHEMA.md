# Bánh Cá Bốn Mùa — Database Schema

> Read this file for any Prisma schema, migration, or DB-level task.
> All schema design decisions are in the Decision Log in `AGENTS.md` — do not re-litigate here.

---

## Currency System

| Unit | Value | Notes |
|---|---|---|
| 1 🐟 | 1,000 VND | Frontend display unit |
| 1 point | 10,000 VND | Loyalty unit |
| Points formula | `floor(total_vnd / 10000)` | Earned on COMPLETED |
| Manual add cap | 100 points/action | ADMIN only |

> All money stored as **integers in VND. Never floats.**

---

## Enums

| Enum | Values |
|---|---|
| `Role` | `CUSTOMER`, `STAFF`, `ADMIN` |
| `VoucherType` | `DISCOUNT`, `PRODUCT` |
| `DiscountType` | `PERCENT`, `FIXED` |
| `VoucherStatus` | `ACTIVE`, `REDEEMED`, `EXPIRED` |
| `UsedChannel` | `ONLINE`, `OFFLINE` |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `READY`, `COMPLETED`, `CANCELLED` |
| `AddonType` | `SELECTOR`, `TOGGLE`, `QUANTITY` |
| `SweetnessLevel` | `NONE`, `QUARTER`, `HALF`, `THREE_QUARTER`, `FULL` |
| `Size` | `M`, `L`, `XL` |

---

## Sweetness Mapping

Frontend displays Vietnamese labels, DB stores enum keys — never store Vietnamese strings.

| Display Label | Enum Value | Default |
|---|---|---|
| Lạt | `NONE` | |
| Vừa | `QUARTER` | ✅ |
| Ngọt | `HALF` | |
| Rất ngọt | `THREE_QUARTER` | |
| Ngọt Điên | `FULL` | |

---

## Tables (16 total)

### users
- `id` uuid PK
- `name` string
- `phone_number` string UK — normalized to +84 before storage
- `password_hash` string — bcryptjs cost 12. Ghost user = `"GHOST_USER_NO_PASSWORD"` (not a valid hash)
- `role` Role — default `CUSTOMER`
- `points_balance` int — default 0
- `qr_token` string UK — UUID, encoded in QR, NEVER expose `id`
- `otp_enabled` bool — default false, enabled in Phase 5
- `created_at` timestamp
- `updated_at` timestamp

### sessions
- `id` uuid PK
- `user_id` uuid FK → users (cascade delete)
- `refresh_token` string UK — UUID, 30-day expiry
- `expires_at` timestamp
- `created_at` timestamp

### otp_attempts — Phase 5 only
No FK to users — phone may not have a user row yet during registration.
- `id` uuid PK
- `phone_number` string — string match only, no FK
- `code_hash` string — SHA-256 of 6-digit code
- `expires_at` timestamp — 5 min TTL
- `attempts` int — max 5 before lockout
- `verified` bool — default false
- `created_at` timestamp

### menu_items
⚠️ Do not auto-delete old Supabase Storage images on replace/delete — deferred.
- `id` uuid PK
- `name` string
- `description` string nullable
- `price_vnd` int nullable — null for `daily` items (prices stored per-size in `menu_item_sizes`); integer VND for `seasonal` and `recipe`
- `category` string — one of `daily` | `seasonal` | `recipe`. Only `daily` items have sizes.
- `image_url` string nullable — Supabase Storage public URL
- `is_available` bool — default true. Soft delete = set false. For daily items, toggles all 3 sizes simultaneously.
- `sort_order` int — default 0
- `created_at` timestamp

### menu_item_sizes
Stores M/L/XL prices for `daily` category items only. One row per size per menu item (always 3 rows per daily item, created in same transaction as the parent).
- `id` uuid PK
- `menu_item_id` uuid FK → menu_items (cascade delete)
- `size` Size — `M` | `L` | `XL`
- `price_vnd` int — integer VND, never null
- Composite unique: (`menu_item_id`, `size`)

### addon_groups
Reusable across menu items via junction table.
- `id` uuid PK
- `name` string — e.g. "Loại sữa"
- `description` string nullable
- `type` AddonType — `SELECTOR` (pick one) | `TOGGLE` (on/off) | `QUANTITY` (amount × price)
- `is_required` bool
- `min_quantity` int nullable — QUANTITY type only
- `max_quantity` int nullable — QUANTITY type only
- `created_at` timestamp

### addon_options
QUANTITY type: one row only. `price_vnd` = price per unit. Frontend total = quantity × price_vnd.
- `id` uuid PK
- `addon_group_id` uuid FK → addon_groups (cascade delete)
- `label` string — e.g. "Sữa bò", "Sữa Oat"
- `price_vnd` int — 0 if no charge
- `is_default` bool
- `sort_order` int

### menu_item_addons — junction table
Many-to-many between menu_items and addon_groups.
- `menu_item_id` uuid FK → menu_items — composite PK
- `addon_group_id` uuid FK → addon_groups — composite PK

### orders
`voucher_id` = DISCOUNT voucher (order level). PRODUCT voucher lives on `order_items.product_voucher_id` (line level).
One order can carry both simultaneously.
- `id` uuid PK
- `user_id` uuid FK → users
- `voucher_id` uuid FK nullable → vouchers — DISCOUNT only, max 1 per order
- `status` OrderStatus — customer default `PENDING`; staff counter order = `COMPLETED` immediately
- `subtotal_vnd` int — sum of all items + addons before discount
- `discount_vnd` int — default 0. If discount > subtotal → total_vnd = 0, no error.
- `total_vnd` int — subtotal_vnd − discount_vnd (min 0)
- `points_earned` int — `floor(total_vnd / 10000)`, set when status → COMPLETED
- `pickup_time` datetime nullable — freeform, customer orders only
- `note` string nullable
- `created_at` timestamp

### order_items
`unit_price_vnd` = 0 when item is free via PRODUCT voucher. Addons on free items are still charged.
- `id` uuid PK
- `order_id` uuid FK → orders (cascade delete)
- `menu_item_id` uuid FK → menu_items
- `quantity` int
- `size` Size nullable — required for `daily` items, null for `seasonal`/`recipe`
- `unit_price_vnd` int — snapshot of the resolved price at order time (from `menu_item_sizes.price_vnd` for daily, or `menu_items.price_vnd` for others). 0 if PRODUCT voucher.
- `addons_price_vnd` int — total addon cost for this line item
- `product_voucher_id` uuid FK nullable → vouchers
- `sweetness` SweetnessLevel — default `QUARTER`
- `note` string nullable — custom instructions (e.g. "ít đá")

### order_item_addons
QUANTITY: quantity = units chosen by user. Total = quantity × unit_price_vnd.
SELECTOR / TOGGLE: quantity always = 1.
- `id` uuid PK
- `order_item_id` uuid FK → order_items (cascade delete)
- `addon_option_id` uuid FK → addon_options
- `quantity` int
- `unit_price_vnd` int — snapshot of `addon_options.price_vnd` at order time

### voucher_packages
Admin-defined reward catalogue. Customers spend points to receive a voucher instance.
⚠️ Do NOT add cascade delete on `menu_item_id` — deletion behavior is unresolved.
- `id` uuid PK
- `name` string — e.g. "Matcha Latte miễn phí"
- `description` string nullable
- `voucher_type` VoucherType
- `points_cost` int
- `discount_type` DiscountType nullable — DISCOUNT type only
- `discount_value` int nullable — e.g. 20 for 20%, 50000 for fixed VND
- `menu_item_id` uuid FK nullable → menu_items — PRODUCT type only
- `is_active` bool — default true
- `expires_after_days` int nullable — null = never expires
- `created_at` timestamp

### vouchers
One instance per customer redemption. Fields copied from package at creation — package edits never affect issued vouchers.
- `id` uuid PK
- `user_id` uuid FK → users
- `package_id` uuid FK → voucher_packages
- `qr_token` string UK — UUID, encoded in QR, NEVER expose `id`
- `voucher_type` VoucherType — copied from package
- `discount_type` DiscountType nullable — copied from package
- `discount_value` int nullable — copied from package
- `menu_item_id` uuid FK nullable → menu_items — copied from package. JOIN for `image_url` at render time.
- `status` VoucherStatus — default `ACTIVE`
- `used_channel` UsedChannel nullable — set on redemption
- `expires_at` timestamp nullable — now + package.expires_after_days
- `redeemed_at` timestamp nullable
- `redeemed_by` uuid FK nullable → users — STAFF or ADMIN only, offline redemptions
- `created_at` timestamp

### points_log
Immutable audit trail. Never edit or delete rows. Reversal = insert new negative-delta row.
- `id` uuid PK
- `user_id` uuid FK → users (cascade delete)
- `delta` int — positive = earned, negative = spent or reversed
- `reason` string — see valid values below
- `performed_by` uuid FK nullable → users — admin id for manual adjustment, null for all system actions
- `reversed_log_id` uuid FK nullable → points_log — set when reason = `reversed_by_admin`
- `order_id` uuid FK nullable → orders — set when reason = `order_complete`
- `voucher_id` uuid FK nullable → vouchers — set when reason = `voucher_redemption`
- `created_at` timestamp
- NOTE: `order_id` and `voucher_id` are mutually exclusive — one is always null

**`reason` valid values:**

| Value | Trigger |
|---|---|
| `order_complete` | Order status → COMPLETED |
| `manual_admin_adjustment` | Admin manually adds/deducts points |
| `voucher_redemption` | Customer spends points on voucher package |
| `reversed_by_admin` | Admin reverses a manual adjustment |

### promotions — Phase 5 only
- `id` uuid PK
- `title` string
- `description` string nullable
- `starts_at` timestamp
- `ends_at` timestamp
- `max_redemptions` int — Redis counter enforces this during spikes
- `is_active` bool
- `created_at` timestamp
