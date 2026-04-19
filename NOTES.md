# Bánh Cá Bốn Mùa — Deferred & Architecture Notes

> Read this only when dealing with deferred issues or backend separation questions.
> Do NOT implement anything in this file without explicit architect sign-off.

---

## Deferred — Do Not Implement

| Issue | Status | Action |
|---|---|---|
| Image cleanup (old Supabase Storage files orphaned on replace/delete) | Deferred | Acceptable for now |
| Voucher package + menu_item cascade delete | Unresolved | Do NOT add cascade. Ask architect. |
| Hard delete menu_item while active vouchers reference it | Deferred | Soft delete only (is_available = false). Ask before any hard delete. |
| Order ready notification (Zalo ZNS via ESMS) | Phase 5 | Alongside OTP |
| Admin first user creation | Manual | Create via Supabase dashboard. No seed/setup route. |
| SEO sitemap + robots.txt | After Phase 2 | Use Next.js built-in. No external library. |
| Structured data (JSON-LD) | After Phase 2 | Add to menu item pages for product schema. |

---

## Backend Separation — Migration Path

> Current: fullstack Next.js — intentional for fast shipping.
> Do NOT pre-optimize or add abstraction layers.
> Only follow this if architect explicitly decides to separate.

If separation becomes necessary:

1. Move `app/api/*` → standalone Express / Fastify / Hono app
2. Move `lib/prisma.ts`, `lib/auth.ts`, `lib/validations/`, `lib/sms.ts`, `lib/storage.ts` → BE repo
3. In `src/services/*` — swap base URL from `/api` to external URL. No other changes.
4. Frontend becomes pure static/SSG Next.js calling external API.

This works cleanly because:
- All business logic is isolated in `lib/` — not scattered in components
- `src/services/` is the only place that knows where data comes from
- API contract `{ data: T }` / `{ error, code }` is consistent throughout
