# Bánh Cá Bốn Mùa — Database Schema

> Read this when working on Prisma schema, migrations, or any DB-level task.
> All decisions about schema design are in AGENTS.md Decision Log — do not re-litigate them here.

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

---

## Tables (15 total)

### users
- `id` uuid PK
- `name` string
- `phone_number` string UK — normalized to +84 format on input
- `password_hash` string — bcryptjs cost 12
- `role` Role — default CUSTOMER
- `points_balance` int — default 0
- `qr_token` string UK — UUID. Encoded in QR. NEVER expose `id`.
- `otp_enabled` bool — default false. Set true in Phase 5.
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
- `attempts` int — max 5 verify attempts before lockout
- `verified` bool — default false
- `created_at` timestamp

### menu_items
⚠️ Do not delete old Supabase Storage images automatically — deferred.
- `id` uuid PK
- `name` string
- `description` string nullable
- `price_vnd` int — integer VND, never float
- `category` string
- `image_url` string nullable — Supabase Storage public URL
- `is_available` bool — default true
- `sort_order` int — default 0
- `created_at` timestamp

### addon_groups
Reusable across menu items via junction table.
- `id` uuid PK
- `name` string — e.g. "Loại sữa"
- `description` string nullable
- `type` AddonType — SELECTOR (pick one) | TOGGLE (on/off) | QUANTITY (amount × price)
- `is_required` bool
- `min_quantity` int nullable — QUANTITY type only
- `max_quantity` int nullable — QUANTITY type only
- `created_at` timestamp

### addon_options
QUANTITY type: one row only. price_vnd = price per unit. Frontend total = quantity × price_vnd.
- `id` uuid PK
- `addon_group_id` uuid FK → addon_groups (cascade delete)
- `label` string — e.g. "Sữa bò", "Sữa Oat"
- `price_vnd` int — 0 if no charge. Per-unit for QUANTITY.
- `is_default` bool
- `sort_order` int

### menu_item_addons — junction table
Many-to-many between menu_items and addon_groups.
- `menu_item_id` uuid FK → menu_items — composite PK
- `addon_group_id` uuid FK → addon_groups — composite PK

### orders
- `id` uuid PK
- `user_id` uuid FK → users
- `voucher_id` uuid FK nullable → vouchers — DISCOUNT only. Max 1 per order.
- `status` OrderStatus — default PENDING
- `subtotal_vnd` int
- `discount_vnd` int — default 0
- `total_vnd` int — subtotal_vnd − discount_vnd
- `points_earned` int — floor(total_vnd / 10000). Set when status → COMPLETED.
- `pickup_time` datetime nullable — freeform, no slot management
- `note` string nullable
- `created_at` timestamp

### order_items
- `id` uuid PK
- `order_id` uuid FK → orders (cascade delete)
- `menu_item_id` uuid FK → menu_items
- `quantity` int
- `unit_price_vnd` int — snapshot of price at order time. 0 if PRODUCT voucher applied.
- `addons_price_vnd` int — total addon cost for this line
- `product_voucher_id` uuid FK nullable → vouchers
- `note` string nullable

### order_item_addons
- `id` uuid PK
- `order_item_id` uuid FK → order_items (cascade delete)
- `addon_option_id` uuid FK → addon_options
- `quantity` int
- `unit_price_vnd` int — snapshot of addon_options.price_vnd at order time

### voucher_packages
Admin-defined reward catalogue. Customers spend points to receive a voucher instance.
⚠️ Do NOT implement cascade delete on menu_item_id — behavior on deletion is unresolved.
- `id` uuid PK
- `name` string — e.g. "Matcha Latte miễn phí"
- `description` string nullable
- `voucher_type` VoucherType
- `points_cost` int
- `discount_type` DiscountType nullable — DISCOUNT type only
- `discount_value` int nullable — e.g. 20 for 20%, 50000 for fixed VND
- `menu_item_id` uuid FK nullable → menu_items — PRODUCT type only
- `is_active` bool — default true
- `expires_after_days` int nullable — days until voucher expires after creation. null = never.
- `created_at` timestamp

### vouchers
One instance per customer redemption. Fields copied from package at creation.
Package edits never affect existing vouchers.
- `id` uuid PK
- `user_id` uuid FK → users
- `package_id` uuid FK → voucher_packages
- `qr_token` string UK — UUID. Encoded in QR. NEVER expose `id`.
- `voucher_type` VoucherType — copied from package
- `discount_type` DiscountType nullable — copied from package
- `discount_value` int nullable — copied from package
- `menu_item_id` uuid FK nullable → menu_items — copied from package. JOIN for image_url at render time.
- `status` VoucherStatus — default ACTIVE
- `used_channel` UsedChannel nullable — set on redemption
- `expires_at` timestamp nullable — now + package.expires_after_days
- `redeemed_at` timestamp nullable
- `redeemed_by` uuid FK nullable → users — STAFF or ADMIN only. Offline redemptions.
- `created_at` timestamp

### points_log
Immutable audit trail. Never edit or delete rows.
Reversal = new negative-delta row (reason = reversed_by_admin).
- `id` uuid PK
- `user_id` uuid FK → users (cascade delete)
- `delta` int — positive = earned, negative = spent or reversed
- `reason` string — one of: `order_complete` | `manual_staff_adjustment` | `voucher_redemption` | `reversed_by_admin`
- `performed_by` uuid FK nullable → users — staff id for manual_staff_adjustment. Null for all system actions.
- `reversed_log_id` uuid FK nullable → points_log — set when reason = reversed_by_admin
- `order_id` uuid FK nullable → orders — set when reason = order_complete
- `voucher_id` uuid FK nullable → vouchers — set when reason = voucher_redemption
- `created_at` timestamp
- NOTE: order_id and voucher_id are mutually exclusive

### promotions — Phase 5 only
- `id` uuid PK
- `title` string
- `description` string nullable
- `starts_at` timestamp
- `ends_at` timestamp
- `max_redemptions` int — Redis counter enforces during spikes
- `is_active` bool
- `created_at` timestamp

---

## Currency System

| Unit | Value | Notes |
|---|---|---|
| 1 🐟 | 1,000 VND | Frontend display unit |
| 1 point | 10,000 VND | Loyalty unit |
| Points formula | floor(total_vnd / 10000) | Earned on COMPLETED |
| Manual add cap | 100 points/action | Staff limit |

All money stored as **integers in VND. Never floats.**
