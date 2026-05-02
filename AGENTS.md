# Bánh Cá Bốn Mùa — Agent Entry Point

> Load this file **first, every session**. No silent workarounds — if something conflicts, stop and ask.

---

## Current State

- [x] Phase 1 — Supabase, Prisma 15 tables, auth routes, middleware, Login/Register pages
- [ ] Phase 2 — Menu + Addons API — **in progress**
- [ ] Phase 3 — Orders + Points
- [ ] Phase 4 — Vouchers + QR
- [ ] Phase 5 — Promotions + OTP + Redis

> When a task is done: change `[ ]` → `[x]`. Read this section first every session.

---

## Index — Read Before Acting

| Task | File |
|---|---|
| Create / move any file or folder | `STRUCTURE.md` |
| API route, request/response shape, business logic | `API.md` |
| DB schema, Prisma, migration, enum | `SCHEMA.md` |
| Deferred issues, unresolved decisions, env vars | `NOTES.md` |
| Admin / staff panel, flows, ghost user | `ADMIN_PLAN.md` |

> Never skip reading the relevant file. Do not rely on memory alone.

---

## Behavior Rules

- Do not open browser or run `npm run dev` / `npm run build` after changes
- After completing a task: write code, save file, stop
- DB sync: `npx prisma db push && npx prisma generate` — agent may run this automatically
- Do not use `migrate dev` — incompatible with pgBouncer

---

## Stack — Never Deviate

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript strict | No `any` — ever |
| Styling | Tailwind CSS | No other styling libraries |
| ORM | Prisma | No raw SQL unless explicitly asked |
| Database | Supabase PostgreSQL | Must use `?pgbouncer=true` in connection string |
| Auth | Custom phone + password, `jose`, httpOnly cookies | No NextAuth, no Supabase Auth |
| Validation | Zod | Every API input — no exceptions |
| Forms | React Hook Form + Zod resolver | |
| State | Zustand — cart only, localStorage | |
| HTTP client | Axios — 1 instance at `src/lib/api/client.ts` | Do not create another instance |
| File storage | Supabase Storage | Bucket: `menu-images` |
| SMS / ZNS | ESMS.vn | `console.log` in dev, real calls in prod |
| QR generate | `qrcode` npm, client-side | |
| QR scan | `html5-qrcode`, mobile camera | |
| Error tracking | Sentry | |
| Cache | Upstash Redis | **Phase 5 ONLY** — do not add before then |
| Deploy | Vercel serverless | |

---

## Hard Rules — Apply to Every Task

- No `any` in TypeScript — ever
- Money = integers in VND, never floats or decimals
- API success: `{ data: T }` / error: `{ error: string, code: string }`
- Never expose `users.id` or `vouchers.id` — always use `qr_token`
- Multi-step DB writes → `prisma.$transaction()`
- Server always re-fetches prices from DB — never trust client-sent prices
- `points_log` rows are immutable — reversal = insert new negative-delta row
- `"use client"` only when hooks or browser events are needed
- No hardcoded secrets — always `process.env`, add new vars to `.env.local.example`
- Every exported function needs a one-line JSDoc
- Every page must export `metadata`. Dynamic pages use `generateMetadata`
- Never import `lib/` inside `src/` — backend is server-only

---

## Decision Log — Non-Negotiable

- Phone normalized to `+84` before any DB storage or comparison
- Cart persisted to localStorage via Zustand — not saved to DB
- Voucher expiry: lazy check at scan/apply time — no background cron
- One order can carry both a PRODUCT voucher (line level) and a DISCOUNT voucher (order level)
- Points = `floor(total_vnd / 10000)`, integers only, earned when status → COMPLETED
- 1 🐟 = 1,000 VND — DB stores integer VND only
- Manual points: ADMIN only, max 100/action — see `API.md` for full spec
- Voucher fields copied from package at creation — package edits never affect issued vouchers
- `redeemed_by` accepts STAFF or ADMIN only
- Soft delete only for `menu_items` — set `is_available = false`, never hard delete
- No cascade delete on `voucher_packages.menu_item_id` — ask architect first
- Admin first user: created manually via Supabase dashboard — no seed, no setup route
- Old Supabase Storage images are not auto-deleted on replace/delete — deferred
- Price snapshot: copy `price_vnd` → `unit_price_vnd` at order creation — never join back to current menu prices; for `daily` items copy from `menu_item_sizes.price_vnd` for the selected size
- No Redis, no OTP, no Zalo ZNS until Phase 5
- Customer order → default `PENDING`; staff counter order → `COMPLETED` immediately
- Ghost user: `password_hash = "GHOST_USER_NO_PASSWORD"` — register flow updates existing row instead of inserting
- All business logic details (routes, request/response shapes, error codes) → `API.md` is single source of truth
- Categories: exactly 3 — `daily`, `seasonal`, `recipe`. Only `daily` items have sizes; `seasonal`/`recipe` never have sizes.
- `menu_items.price_vnd` is nullable: null for `daily` (prices in `menu_item_sizes`), non-null integer for `seasonal`/`recipe`
- Daily item creation: 1 `menu_items` row + exactly 3 `menu_item_sizes` rows (M, L, XL), all in one `prisma.$transaction()`
- Daily item `is_available` toggle affects the whole item — no per-size availability
- `order_items.size` is nullable: required (M/L/XL) for `daily`, null for `seasonal`/`recipe`; server validates this at order time
