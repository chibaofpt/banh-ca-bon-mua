# Bánh Cá Bốn Mùa — API Routes

> Read this when implementing or modifying any API route.
> Auth rules, response shape, and business logic decisions are in AGENTS.md.

---

## Response Shape (all routes)

- Success: `{ data: T }`
- Error: `{ error: string, code: string }`

---

## Auth Routes — Public

| Route | Method | Purpose |
|---|---|---|
| /api/auth/register | POST | Create account |
| /api/auth/login | POST | Login, issue tokens |
| /api/auth/logout | POST | Delete session, clear cookies |
| /api/auth/refresh | POST | Swap refresh token → new access token |

## Menu Routes — Public

| Route | Method | Purpose |
|---|---|---|
| /api/menu | GET | All available items + addons grouped by category |

## Customer Routes — Customer role required

| Route | Method | Purpose |
|---|---|---|
| /api/orders | POST | Create order from cart |
| /api/orders | GET | List own orders (newest first, limit 20) |
| /api/orders/[id] | GET | Own order detail (verify ownership) |
| /api/profile | GET | Own profile info |
| /api/profile/points | GET | Balance + last 20 log entries |
| /api/profile/vouchers | GET | Own ACTIVE vouchers |
| /api/profile/vouchers/redeem | POST | Spend points on a voucher package |

## Staff Routes — Staff or Admin role required

| Route | Method | Purpose |
|---|---|---|
| /api/staff/scan | GET | Resolve QR token → user or voucher |
| /api/staff/vouchers/[id]/redeem | PATCH | Mark voucher REDEEMED offline |
| /api/staff/points/add | POST | Manually add points to customer (max 100) |

## Admin Routes — Admin role required

| Route | Method | Purpose |
|---|---|---|
| /api/admin/orders/[id]/status | PATCH | Update order status |
| /api/admin/menu | GET | All items including unavailable |
| /api/admin/menu | POST | Create menu item with image upload |
| /api/admin/menu/[id] | PUT | Update menu item |
| /api/admin/menu/[id] | DELETE | Soft delete (set is_available = false) |
| /api/admin/addon-groups | POST/PUT/DELETE | Manage addon groups and options |
| /api/admin/voucher-packages | POST/PUT/DELETE | Manage voucher packages |
| /api/admin/points-log | GET | All manual adjustment logs across all staff |
| /api/admin/points-log/[id]/reverse | POST | Reverse a manual points entry |
| /api/admin/promotions | POST/PUT/DELETE | Phase 5 only |

---

## Middleware Protection

```
/profile/*         → Customer+
/api/orders/*      → Customer+
/api/profile/*     → Customer+
/api/staff/*       → Staff+
/api/admin/*       → Admin only
```

---

## Key Implementation Rules

- Zod-validate ALL inputs before touching the database — no exceptions
- QR scan: check users table first, then vouchers. Returns `{ type: "user" | "voucher", data: {...} }`
- Order creation: one `prisma.$transaction()` for order + items + addons
- Points award: same transaction as status → COMPLETED update
- Points spend: deduct + create voucher in one `prisma.$transaction()`
- Staff manual points: max 100/action, log performed_by = staff user id
- Admin points reversal: insert new row (negative delta), never edit original
- Soft delete only for menu items: set `is_available = false`
