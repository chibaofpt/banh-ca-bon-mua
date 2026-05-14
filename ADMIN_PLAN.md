# Bánh Cá Bốn Mùa — Admin & Staff Panel

> Read this file when working on any admin or staff feature.
> Source of truth for schema and coding rules: `AGENTS.md`.
> Source of truth for folder layout and routes: `STRUCTURE.md` and `API.md`.

---

## 1. Login Flow

- Separate login page: `/admin/login` — not shared with customer `/login`
- Reuses `POST /api/auth/login` — role differentiated via JWT claim
- Redirect after login by role:
  - `ADMIN` → `/admin/menu`
  - `STAFF` → `/staff/orders`

---

## 2. Layout Shell — `(admin-shell)/layout.tsx`

- Primary device: **mobile**
- Top bar: logo + username + logout button
- Bottom tab bar: tabs by role (see table below)
- Content area in between, full scroll. No sidebar.

| Role | Tabs |
|---|---|
| STAFF | Tạo Order / Quét QR / Đơn hàng |
| ADMIN | Tạo Order / Quét QR / Đơn hàng / Sản phẩm / Điểm & Voucher |

---

## 3. Staff — Create Order (`/staff/orders`)

### Main Screen
- **Quét QR** button at top → opens `QRScannerModal`
- Menu displayed as cards (`StaffMenuCard`), split by category
- Tap card → `AddonModal` to select addons → **Add to cart**
- Item size is read from `menu_items` — not stored separately on the order

### QR Scan Within Order Flow
Calls `GET /api/staff/scan?token=xxx`:

| Returned `type` | Action |
|---|---|
| `voucher` + PRODUCT | Add to cart as line item, `unit_price_vnd = 0`, open `AddonModal` |
| `voucher` + DISCOUNT | Apply discount to order |
| `user` | Pre-fill customer phone into order form |

### Confirm Order
1. Tap cart → `StaffCartDrawer`
2. Enter customer phone (`StaffOrderForm`)
3. Phone exists → attach `user_id`
4. Phone not found → enter nickname → create ghost user → attach `user_id`
5. Tap **Tạo đơn** → `POST /api/staff/orders` → clear cart state

### Staff Order Rules
- `pickup_time`: not collected — counter orders are immediate
- `note` on order_item: optional — staff may enter custom instructions (e.g. "ít đá", "không sữa")
- Status = `COMPLETED` immediately on creation, points awarded at that moment
- To cancel → admin sets `CANCELLED` manually + reverses points if needed

---

## 4. Staff & Admin — Order List (`/staff/orders-list`)

- All orders across all dates, newest first
- Each `OrderCard`: customer name + phone, created time, item list (collapsible), total "🐟 X cá", status badge
- Status badge: COMPLETED (green) / CANCELLED (red)
- **STAFF**: read-only, no actions
- **ADMIN**: "Huỷ đơn" button → confirmation dialog → `PATCH /api/admin/orders/[id]/status` with `{ status: "CANCELLED" }`
- After cancellation → manually reverse points via `/admin/points-log` if needed

---

## 5. Staff — QR Scan Standalone (`/staff/scan`)

> Context outside the order creation flow — used for offline voucher redemption.

- Scan `vouchers.qr_token` → show voucher info → confirm → `PATCH /api/staff/vouchers/[id]/redeem`
- Scan `users.qr_token` → show customer info (name, points balance) — no further action
- **Staff cannot manually add points** — ADMIN only

---

## 6. Admin — Menu Management (`/admin/menu`)

- List + CRUD `menu_items`: `GET/POST /api/admin/menu`, `PUT/DELETE /api/admin/menu/[id]`
- List + manage addon groups + options: `GET/POST/PUT/DELETE /api/admin/addon-groups`
- Attach / detach addon group from menu item: `POST/DELETE /api/admin/menu-item-addons`
- Upload images to Supabase Storage (bucket: `menu-images`, max 5MB)
- Soft delete only (`is_available = false`) — never hard delete
- Display all items including `is_available = false`

### Addon system

Addons are **auto-populated per category** when a menu item is created — admin does not need to manually attach addons after creation.

| Category | Loại sữa | Đá Nước Dừa | Kem Matcha | Thêm bột matcha |
|---|---|---|---|---|
| `daily` | ✅ | ✅ | ✅ | ✅ |
| `recipe` | ❌ | ✅ | ✅ | ✅ |
| `seasonal` | ✅ | ✅ | ✅ | ❌ |

Admin can override per-item via a toggle list in `MenuItemForm.tsx` — shows all available addon groups with on/off toggle. Admin can add or remove any addon including category defaults. No distinction shown between "default" and "manually added".

Category defaults are defined in `lib/menuDefaults.ts` using addon group UUIDs.

### Daily item create/edit flow (`MenuItemForm.tsx`)

When category = `daily`:
- Form shows **3 price fields**: M / L / XL — all required
- `price_vnd` top-level field is hidden and not sent
- On **Create**: `POST /api/admin/menu` with `{ ..., category: "daily", sizes: [{ size: "M", price_vnd }, { size: "L", price_vnd }, { size: "XL", price_vnd }] }` — server creates 1 `menu_items` + 3 `menu_item_sizes` in a transaction
- On **Edit**: `PUT /api/admin/menu/[id]` with `{ ..., sizes: [...] }` — server upserts each size row
- On **Delete** (soft): `DELETE /api/admin/menu/[id]` → `is_available = false`; cascade on `menu_item_sizes` fires automatically on hard delete but soft delete only touches the parent row — all 3 sizes are effectively hidden since availability is checked on the parent

When category = `seasonal` or `recipe`:
- Form shows single `price_vnd` field — required, non-null integer
- `sizes` field is absent from request body

---

## 7. Admin — Points Log (`/admin/points-log`)

- View full manual adjustment history: `GET /api/admin/points-log`
- **Manually add points** to customer: max 100/action → `POST /api/admin/points/add`
- **Reverse an entry**: `POST /api/admin/points-log/[id]/reverse`

---

## 8. Admin — Voucher Packages (`/admin/voucher-packages`)

- Separate page from points log
- List + manage voucher packages: `GET/POST /api/admin/voucher-packages`, `PUT/DELETE /api/admin/voucher-packages/[id]`
- Form component: `VoucherPackageForm.tsx`

---

## 9. Ghost User Convention

When a customer has no account, create a new user:

```ts
{
  phone_number: "+84xxxxxxxxx",            // normalized
  name: nickname,                           // entered by staff
  password_hash: "GHOST_USER_NO_PASSWORD", // not a bcrypt hash → login always fails
  role: "CUSTOMER",
}
```

- Identified by `password_hash === "GHOST_USER_NO_PASSWORD"` when needed
- Orders, points, and vouchers are attached to this `user_id` normally
- Ghost users accumulate points like any customer
- If customer later registers → `POST /api/auth/register` detects ghost user by phone → updates `password_hash` + `name` on same row, no data lost

---

## 10. Out of Scope for Current Phase

- Dashboard overview (revenue, pending orders)
- Staff account management
- Promotions — Phase 5
- Zalo ZNS notifications — Phase 5
