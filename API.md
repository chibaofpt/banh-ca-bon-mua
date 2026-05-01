# Bánh Cá Bốn Mùa — API Routes

> Read this file when implementing or modifying any API route.

---

## Response Shape

- Success: `{ data: T }`
- Error: `{ error: string, code: string }`

---

## Error Codes

| code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Zod schema failed |
| `UNAUTHORIZED` | No valid session / token expired |
| `FORBIDDEN` | Authenticated but insufficient role |
| `NOT_FOUND` | Resource does not exist |
| `CONFLICT` | Unique constraint or state conflict (e.g. phone already registered) |
| `INSUFFICIENT_POINTS` | Not enough points for voucher redemption |
| `VOUCHER_EXPIRED` | Voucher past expiry date |
| `VOUCHER_REDEEMED` | Voucher already used |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Auth Cookies

| Cookie | Value | Expiry |
|---|---|---|
| `access_token` | JWT signed with `JWT_SECRET` | 15 min |
| `refresh_token` | UUID stored in `sessions` table | 30 days |

Both set as `httpOnly`, `secure`, `sameSite=strict`.

---

## Middleware Behavior

- Reads `access_token` cookie → verifies JWT via `jose`
- On failure: returns `401 UNAUTHORIZED` (API routes) or redirects to `/login` (page routes)
- Role check: reads `role` claim from JWT payload
- Protected routes:

```
/profile/*        → CUSTOMER+
/api/orders/*     → CUSTOMER+
/api/profile/*    → CUSTOMER+
/api/staff/*      → STAFF or ADMIN
/api/admin/*      → ADMIN only
/admin/login      → public
```

---

## Pagination

- Strategy: **offset-based**
- Default: `limit=20`, `offset=0`
- Query params: `?limit=20&offset=0`
- Response shape:

```ts
{
  data: {
    items: T[],
    total: number,
    limit: number,
    offset: number
  }
}
```

Applied to: `GET /api/orders`, `GET /api/admin/points-log`

---

## Image Upload Flow

- Client calls `POST /api/admin/menu` or `PUT /api/admin/menu/[id]` with `multipart/form-data`
- Route handler uploads to Supabase Storage via `lib/storage.ts`
- Bucket: `menu-images` (public bucket)
- Size limit: 5MB
- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Returns public URL → stored as `menu_items.image_url`
- Old image is NOT deleted on replace — deferred cleanup

---

## Routes

### Public

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login, issue tokens |
| `/api/auth/logout` | POST | Delete session, clear cookies |
| `/api/auth/refresh` | POST | Swap refresh token → new access token |
| `/api/menu` | GET | All available items + addons grouped by category |

### Customer — CUSTOMER role

| Route | Method | Purpose |
|---|---|---|
| `/api/orders` | POST | Create order from cart |
| `/api/orders` | GET | List own orders (newest first, limit 20) |
| `/api/orders/[id]` | GET | Own order detail (verify ownership) |
| `/api/profile` | GET | Own profile info |
| `/api/profile/points` | GET | Balance + last 20 log entries |
| `/api/profile/vouchers` | GET | Own ACTIVE vouchers |
| `/api/profile/vouchers/redeem` | POST | Spend points on a voucher package |

### Staff — STAFF or ADMIN

| Route | Method | Purpose |
|---|---|---|
| `/api/staff/orders` | POST | Create order at counter (status = COMPLETED immediately) |
| `/api/staff/scan` | GET | Resolve QR token → user or voucher |
| `/api/staff/vouchers/[id]/redeem` | PATCH | Mark voucher REDEEMED offline |

### Admin — ADMIN only

| Route | Method | Purpose |
|---|---|---|
| `/api/admin/points/add` | POST | Manually add points to customer (max 100) |
| `/api/admin/orders/[id]/status` | PATCH | Update order status (any valid transition) |
| `/api/admin/menu` | GET | All items including unavailable |
| `/api/admin/menu` | POST | Create menu item with image upload |
| `/api/admin/menu/[id]` | PUT | Update menu item |
| `/api/admin/menu/[id]` | DELETE | Soft delete — sets `is_available = false` |
| `/api/admin/addon-groups` | GET | List all addon groups with their options |
| `/api/admin/addon-groups` | POST | Create addon group |
| `/api/admin/addon-groups/[id]` | PUT | Update addon group |
| `/api/admin/addon-groups/[id]` | DELETE | Delete addon group |
| `/api/admin/menu-item-addons` | POST | Attach addon group to menu item |
| `/api/admin/menu-item-addons` | DELETE | Detach addon group from menu item |
| `/api/admin/voucher-packages` | GET | List all voucher packages |
| `/api/admin/voucher-packages` | POST | Create voucher package |
| `/api/admin/voucher-packages/[id]` | PUT | Update voucher package |
| `/api/admin/voucher-packages/[id]` | DELETE | Deactivate voucher package |
| `/api/admin/points-log` | GET | All manual adjustment logs |
| `/api/admin/points-log/[id]/reverse` | POST | Reverse a manual points entry |
| `/api/admin/promotions` | POST/PUT/DELETE | Phase 5 only |

---

## Request / Response Specs

### `POST /api/auth/register`
```ts
// Request
{ phone_number: string, password: string, name: string }

// Special case: if phone exists with password_hash = "GHOST_USER_NO_PASSWORD"
// → UPDATE existing row (password_hash, name, updated_at) instead of INSERT
// → Returns same user with updated fields
```

### `GET /api/menu`
```ts
// Response
{
  data: {
    [category: string]: {
      id: string
      name: string
      description: string | null
      price_vnd: number
      image_url: string | null
      sort_order: number
      addon_groups: {
        id: string
        name: string
        type: "SELECTOR" | "TOGGLE" | "QUANTITY"
        is_required: boolean
        min_quantity: number | null
        max_quantity: number | null
        options: {
          id: string
          label: string
          price_vnd: number
          is_default: boolean
          sort_order: number
        }[]
      }[]
    }[]
  }
}
```

### `POST /api/orders` — Customer
```ts
// Request
{
  items: {
    menu_item_id: string
    quantity: number
    sweetness: "NONE" | "QUARTER" | "HALF" | "THREE_QUARTER" | "FULL"
    note?: string
    addon_option_ids: { option_id: string, quantity: number }[]
    product_voucher_id?: string   // PRODUCT voucher applied to this line
  }[]
  voucher_id?: string             // DISCOUNT voucher at order level
  pickup_time?: string            // freeform datetime string
  note?: string
}
```

### `POST /api/staff/orders` — Staff counter order
```ts
// Request
{
  phone_number: string            // normalized to +84 by server
  customer_name?: string          // required only if phone not found (ghost user creation)
  items: {
    menu_item_id: string
    quantity: number
    sweetness: "NONE" | "QUARTER" | "HALF" | "THREE_QUARTER" | "FULL"
    note?: string                 // custom instructions (e.g. "ít đá")
    addon_option_ids: { option_id: string, quantity: number }[]
    product_voucher_id?: string
  }[]
  voucher_id?: string
}
// pickup_time: not collected — staff counter orders are immediate
// Status: set to COMPLETED immediately, points awarded at creation
```

### `POST /api/profile/vouchers/redeem`
```ts
// Request
{ package_id: string }
```

### `GET /api/staff/scan?token=xxx`
```ts
// Response — user
{
  data: {
    type: "user"
    data: {
      id: string          // users.qr_token (NOT users.id)
      name: string
      phone_number: string
      points_balance: number
    }
  }
}

// Response — voucher
{
  data: {
    type: "voucher"
    data: {
      id: string          // vouchers.qr_token (NOT vouchers.id)
      voucher_type: "DISCOUNT" | "PRODUCT"
      discount_type: "PERCENT" | "FIXED" | null
      discount_value: number | null
      menu_item_id: string | null
      status: "ACTIVE" | "REDEEMED" | "EXPIRED"
      expires_at: string | null
    }
  }
}
```

### `PATCH /api/admin/orders/[id]/status`
```ts
// Request
{ status: "PENDING" | "CONFIRMED" | "READY" | "COMPLETED" | "CANCELLED" }
// All transitions permitted — admin is responsible for valid sequencing
```

### `POST /api/admin/menu-item-addons`
```ts
// Request
{ menu_item_id: string, addon_group_id: string }
```

### `DELETE /api/admin/menu-item-addons`
```ts
// Request
{ menu_item_id: string, addon_group_id: string }
```

---

## Business Logic Notes

### Auth
- Phone normalized to `+84` before storage: `"0912345678"` → `"+84912345678"`
- Timing-safe: always run bcrypt compare even if user not found (prevents phone enumeration)
- Ghost user register: check `password_hash = "GHOST_USER_NO_PASSWORD"` before insert

### Orders
- All order creation: validate + re-fetch prices from DB in `prisma.$transaction()`
- Customer order (`POST /api/orders`): status default = `PENDING`
- Staff order (`POST /api/staff/orders`): status = `COMPLETED` immediately, points awarded at creation
- DISCOUNT voucher: `discount_vnd = subtotal_vnd × percent / 100` or fixed amount. If `discount_vnd > subtotal_vnd` → `total_vnd = 0`, no error.
- Points earned in same transaction as status → COMPLETED

### Vouchers
- Expiry checked at scan (staff) or apply (customer) time — no background job
- DISCOUNT online: set `orders.voucher_id`, calculate `discount_vnd`
- PRODUCT online: add `order_item` with `unit_price_vnd = 0`, set `product_voucher_id`. Addons still charged.
- PRODUCT/DISCOUNT offline: mark REDEEMED + `used_channel = OFFLINE`. No order created.

### Points
- Earn: `floor(total_vnd / 10000)` on COMPLETED
- Spend: deduct + create voucher in `prisma.$transaction()`
- Manual add: ADMIN only, max 100/action, `performed_by` = admin user id
- Reversal: insert new row — negative delta, `reason = "reversed_by_admin"`, `reversed_log_id` = original row id

### QR Scan
1. Check `users` table by `qr_token` first
2. If not found, check `vouchers` table
3. Never return internal `id` — always return `qr_token` as identifier

### `points_log.reason` Valid Values
| Value | Trigger |
|---|---|
| `order_complete` | Order status → COMPLETED |
| `manual_admin_adjustment` | Admin manually adds/deducts points |
| `voucher_redemption` | Customer spends points on voucher package |
| `reversed_by_admin` | Admin reverses a manual adjustment |
