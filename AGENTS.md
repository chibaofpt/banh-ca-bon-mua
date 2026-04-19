# Bánh Cá Bốn Mùa — Agent Core Rules

> Single source of truth. Read fully before writing any code.
> If a decision seems wrong — stop and ask. Never work around silently.
> Do not question the Decision Log — decisions were made intentionally.

## Load additional context when needed
- Working on DB schema / Prisma? → Read SCHEMA.md
- Implementing or modifying API routes? → Read API.md
- Questions about deferred work or BE migration? → Read NOTES.md

---

## Current State

Last updated: 2025

- [x] Phase 0 — Landing Page — **done**
  - [x] VideoHero, IntroSection, FeatureCard components
  - [x] MenuPage with tabs, card grid, modal
  - [x] Cart with Zustand + localStorage
  - [x] menu.json static data
  - [x] Zalo pre-fill message (no real order yet)
- [ ] Phase 1 — Foundation — **not started**
  - [ ] Supabase project created
  - [ ] Prisma schema written and migrated (all 15 tables)
  - [ ] lib/prisma.ts singleton
  - [ ] lib/auth.ts (signJwt, verifyJwt, getSession)
  - [ ] POST /api/auth/register
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/logout
  - [ ] POST /api/auth/refresh
  - [ ] middleware.ts protecting routes
  - [ ] Register page
  - [ ] Login page
- [ ] Phase 2 — Menu + Addons — not started
- [ ] Phase 3 — Orders + Points — not started
- [ ] Phase 4 — Vouchers + QR — not started
- [ ] Phase 5 — Promotions + OTP + Redis — not started

> When you complete a task: change [ ] to [x] in this section.
> When starting a new session: read this section first to know where you are.

---

## Decision Log

- Language is Vietnamese only — no i18n library needed
- Phone numbers always normalized to +84 format before any DB storage or comparison
- Cart uses localStorage via Zustand — not persisted to DB
- No pickup time slot management — pickup_time is freeform datetime
- Voucher expiry checked lazily at scan/apply time — no background cron
- PRODUCT voucher online = order_item with unit_price_vnd = 0, product_voucher_id set. Addons still charged.
- One order can carry both a PRODUCT voucher (line item) and a DISCOUNT voucher (order level)
- Points formula = floor(total_vnd / 10000)
- Currency: 1 fish (🐟) = 1,000 VND. All DB values stored as integers in VND. Never floats.
- Manual staff points: max 100 per action. performed_by = staff user id. Null for system actions.
- points_log rows are immutable — reversal = new negative-delta row (reason = reversed_by_admin, reversed_log_id = original)
- Voucher fields copied from package at creation — package edits never affect issued vouchers
- redeemed_by on vouchers accepts STAFF or ADMIN role only
- PRODUCT voucher offline = mark REDEEMED, no order created
- Admin first user: created manually via Supabase dashboard — no seed/setup route
- Image cleanup deferred — do not delete old Supabase Storage files automatically
- Voucher package + menu_item cascade delete unresolved — do not implement, ask architect
- No Redis until Phase 5 — do not add Upstash before then
- Supabase connection must include ?pgbouncer=true for Vercel serverless
- Never expose users.id or vouchers.id in QR codes/URLs — always use qr_token (UUID field)
- Server always re-fetches prices from DB at order creation — never trust client prices
- Price snapshots: copy price_vnd into unit_price_vnd at order creation — never join back to current prices
- Voucher image: no image_url on voucher_packages. PRODUCT voucher renders image via menu_items.image_url JOIN. DISCOUNT uses generic UI.
- Next.js fullstack (FE + BE same repo) — intentional. Do not pre-optimize for separation.
- SEO: every page exports metadata with title + description. generateMetadata for dynamic pages.

---

## Stack — Never Deviate

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16, App Router | TypeScript strict — no `any` ever |
| Styling | Tailwind CSS | No other styling libraries, no inline styles |
| ORM | Prisma | All DB access through Prisma. No raw SQL unless asked. |
| Database | Supabase PostgreSQL | Connection must use ?pgbouncer=true |
| File storage | Supabase Storage | Menu item images |
| Auth | Custom phone + password (now), OTP Phase 5 | jose, httpOnly cookies. NO NextAuth. NO Supabase Auth. |
| Validation | Zod | Every API route input — no exceptions |
| Forms | React Hook Form + Zod resolver | |
| Cart state | Zustand | Cart only. localStorage. |
| SMS / ZNS | ESMS.vn | console.log in dev, real calls in prod |
| Cache | Upstash Redis | Phase 5 ONLY |
| Deploy | Vercel | Serverless |
| Error tracking | Sentry | |
| QR generation | qrcode (npm) | Client-side |
| QR scanning | html5-qrcode | Camera, mobile-friendly |

---

## Coding Rules

1. Server components by default. `"use client"` only for hooks or browser events.
2. No `any` in TypeScript — ever.
3. Zod-validate ALL API inputs before touching the database.
4. Multi-step DB writes must use `prisma.$transaction()`.
5. Money = integers in VND. Never floats.
6. Never put `users.id` or `vouchers.id` in QR codes or URLs — always use `qr_token`.
7. API success: `{ data: T }`. API error: `{ error: string, code: string }`.
8. No hardcoded secrets — always `process.env`. Add new vars to `.env.local.example`.
9. Supabase connection must include `?pgbouncer=true`.
10. Every exported function needs a one-line JSDoc.
11. Points are always integers. No fractional points.
12. Price snapshots: copy price at order creation into `unit_price_vnd` — never join back to current menu prices.
13. `points_log` rows are immutable. Reversal = insert new row.
14. Every page must export a `metadata` object (title + description). `generateMetadata` for dynamic pages.
15. Never import from `lib/` (backend) inside `src/` (frontend).
16. Business logic goes in `lib/` or route handlers — never inline in components or views.

---

## Folder Structure

Read STRUCTURE.MD

---

## Business Logic Summary

### Auth
- Phone → +84 format before storage ("0912..." → "+84912...")
- Access token: JWT 15 min, JWT_SECRET via jose, httpOnly cookie
- Refresh token: UUID 30 days, stored in sessions table
- Middleware protects: /profile/*, /api/orders/*, /api/profile/*, /api/staff/*, /api/admin/*
- Always run bcrypt compare even if user not found (prevent phone enumeration)

### Orders
- Create order + items + addons in one `prisma.$transaction()`
- Server fetches prices from DB — never use client-sent prices
- Points awarded in same transaction as status → COMPLETED

### Vouchers
- Expiry check at scan time (staff) and online apply time (customer)
- DISCOUNT online: set orders.voucher_id, calculate discount_vnd
- PRODUCT online: order_item with unit_price_vnd = 0, set product_voucher_id
- PRODUCT/DISCOUNT offline: mark REDEEMED + used_channel = OFFLINE. No order created.

### Points
- Earn: floor(total_vnd / 10000) on COMPLETED
- Spend: deduct + create voucher in `prisma.$transaction()`
- Staff manual add: max 100/action. Logged with performed_by = staff id.
- Admin reversal: new row (negative delta, reversed_by_admin, reversed_log_id)

### QR
- User QR: encodes users.qr_token
- Voucher QR: encodes vouchers.qr_token
- GET /api/staff/scan?token=xxx → check users first, then vouchers
- Returns: `{ type: "user" | "voucher", data: {...} }`

---

## Build Phases

| # | Phase | Key deliverables | Status |
|---|---|---|---|
| 0 | Landing Page | VideoHero, menu static, cart Zustand, Zalo pre-fill | Done |
| 1 | Foundation | Supabase, Prisma schema (15 tables), auth, middleware | Done |
| 2 | Menu + Addons | GET /api/menu, admin CRUD, image upload, addon groups | Not started |
| 3 | Orders + Points | Cart → real order, status flow, points on COMPLETED | Not started |
| 4 | Vouchers + QR | Packages, wallet, QR gen, staff scanner, manual points | Not started |
| 5 | Promotions + OTP + Redis | OTP, Zalo ZNS, Upstash Redis, load test 3k users | Not started |

---

## Environment Variables

```bash
DATABASE_URL="postgres://...?pgbouncer=true"   # pooled — runtime
DIRECT_URL="postgresql://..."                   # direct — Prisma CLI only
JWT_SECRET=""                                   # openssl rand -base64 32
ESMS_API_KEY=""
ESMS_SECRET_KEY=""
ESMS_SANDBOX="1"                                # 0 in production
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SENTRY_DSN=""
# Phase 5 only:
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```
