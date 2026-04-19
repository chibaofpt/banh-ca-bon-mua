# Project Structure — Bánh Cá Bốn Mùa

> This file defines the canonical folder layout for the entire project.
> Read this before creating any new file or directory.
> When in doubt about where something goes — check here first, then ask.

## Stack
- Next.js 16 App Router
- TypeScript strict
- Tailwind CSS
- Zustand (cart state)
- Prisma + Supabase PostgreSQL (Phase 1+)
- jose (auth, Phase 1+)
- Zod + React Hook Form (Phase 1+)

---

## Folder Structure

```
app/                              # Next.js App Router — entry points only
  (public)/                       # public-facing pages, no auth required
    page.tsx                      # landing page → imports from src/views/HomePage
    menu/
      page.tsx                    # menu browsing → imports from src/views/MenuPage
  (auth)/                         # Phase 1
    login/
      page.tsx
    register/
      page.tsx
  (customer)/                     # Phase 3+ — requires CUSTOMER role
    profile/
      page.tsx
    orders/
      page.tsx
      [id]/
        page.tsx
    points/
      page.tsx
    vouchers/
      page.tsx
  (staff)/                        # Phase 4 — requires STAFF or ADMIN role
    scan/
      page.tsx
    orders/
      page.tsx
    points/
      page.tsx
  (admin)/                        # Phase 4 — requires ADMIN role
    dashboard/
      page.tsx
    menu/
      page.tsx
    voucher-packages/
      page.tsx
    points-log/
      page.tsx
  api/                            # Route handlers — business logic delegates to lib/
    auth/
      register/route.ts
      login/route.ts
      logout/route.ts
      refresh/route.ts
    menu/
      route.ts                    # Phase 2: replaces static menu.json
    orders/
      route.ts
      [id]/route.ts
    profile/
      route.ts
      points/route.ts
      vouchers/
        route.ts
        redeem/route.ts
    staff/
      scan/route.ts
      vouchers/[id]/redeem/route.ts
      points/add/route.ts
    admin/
      orders/[id]/status/route.ts
      menu/
        route.ts
        [id]/route.ts
      addon-groups/route.ts
      voucher-packages/route.ts
      points-log/
        route.ts
        [id]/reverse/route.ts
      promotions/route.ts         # Phase 5 only

src/                              # Frontend source — never import lib/ from here
  views/                          # Full page compositions — import components + services
    HomePage.tsx
    MenuPage.tsx
    LoginPage.tsx                 # Phase 1
    RegisterPage.tsx              # Phase 1
    ProfilePage.tsx               # Phase 3
    OrdersPage.tsx                # Phase 3
    PointsPage.tsx                # Phase 4
    VouchersPage.tsx              # Phase 4

  components/                     # UI only — no business logic, no data fetching
    common/                       # reusable across the whole app
      Button.tsx
      Badge.tsx
      Modal.tsx
      Drawer.tsx
    # shadcn/ui is not used in this project.
    # Write primitives directly with Tailwind when needed.
    # Button, Input, Modal, Drawer → place in common/ or the relevant domain folder.
    home/                         # HomePage only
      VideoHero.tsx
      IntroSection.tsx
      FeatureCard.tsx
    menu/                         # MenuPage only
      MenuCard.tsx
      ProductModal.tsx
      CartButton.tsx
      CartDrawer.tsx
      TabBar.tsx
    auth/                         # Phase 1
      PhoneInput.tsx
      PasswordInput.tsx

  services/                       # Data fetching — the only layer that knows API URLs
    menuService.ts                # fetchMenu() — swap URL in Phase 2, nothing else changes
    orderService.ts               # Phase 3
    authService.ts                # Phase 1
    profileService.ts             # Phase 3
    voucherService.ts             # Phase 4

  lib/
    store/
      cartStore.ts                # Zustand cart store — localStorage persisted
    hooks/
      useScrollProgress.ts
      useBodyScrollLock.ts
    types/
      menu.ts                     # DailyItem, SeasonalItem, Addon, MenuData
      cart.ts                     # CartItem, CartStore
      order.ts                    # Phase 3
      user.ts                     # Phase 1

  utils/
    formatPrice.ts                # formatPrice(price) → "🐟 {price} cá"
    deriveTags.ts
    buildZaloMessage.ts           # pre-fill Zalo string from cart (used until Phase 3)

public/
  data/
    menu.json                     # static data — replaced by /api/menu in Phase 2
  demo.mp4

lib/                              # Backend shared — server only, NEVER import in src/
  prisma.ts                       # singleton PrismaClient
  auth.ts                         # signJwt, verifyJwt, getSession
  sms.ts                          # ESMS wrapper (console.log in dev)
  storage.ts                      # Supabase Storage helpers
  validations/                    # Zod schemas — one file per domain
    auth.ts
    menu.ts
    order.ts
    voucher.ts
    points.ts

middleware.ts                     # JWT verification, route protection
prisma/
  schema.prisma                   # all 15 tables
.env.local                        # secrets — never commit
.env.local.example                # template — commit this
AGENTS.md                         # source of truth — read first every session
CLAUDE.md                         # agent behavior rules
STRUCTURE.md                      # this file
```

---

## Pattern Rules

### app/**/page.tsx — entry only
```tsx
// app/(public)/page.tsx
import HomePage from '@/src/views/HomePage'
export default function Page() { return <HomePage /> }

// With metadata (required on every page)
export const metadata = {
  title: 'Bánh Cá Bốn Mùa — Matcha Takeaway',
  description: 'Đồ uống matcha tươi ngon tại ...',
}
```

### src/views/ — composition only
- Import components, services, hooks
- Handle page-level state (activeTab, selectedItem, loading)
- No JSX styling logic — delegate to components
- No direct fetch calls — use services

### src/components/ — UI only
- Receive props, render UI
- No data fetching
- No imports from `src/services/` or `lib/`

### src/services/ — data layer
```ts
// src/services/menuService.ts
// Phase 0-1: static JSON
export const fetchMenu = async (): Promise<MenuData> => {
  const res = await fetch('/data/menu.json')
  return res.json()
}

// Phase 2: just swap the URL — nothing else changes
export const fetchMenu = async (): Promise<MenuData> => {
  const res = await fetch('/api/menu')
  return res.json()
}
```

### lib/ — backend only
```ts
// lib/validations/order.ts
// lib/auth.ts
// lib/prisma.ts
// Never import these inside src/ — they are server-only
```

### app/api/**/route.ts — route handlers
```ts
// Validate input with Zod (lib/validations/)
// Call lib/ functions for business logic
// Return { data: T } on success, { error: string, code: string } on failure
// Never inline business logic here — delegate to lib/
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Pages (views) | PascalCase + Page suffix | `HomePage`, `MenuPage` |
| Components | PascalCase | `MenuCard`, `VideoHero` |
| Services | camelCase + Service suffix | `menuService`, `orderService` |
| Hooks | camelCase + use prefix | `useScrollProgress` |
| Utils | camelCase | `formatPrice`, `deriveTags` |
| Types files | camelCase | `menu.ts`, `cart.ts` |
| Route handlers | `route.ts` | Next.js convention |
| Zod schemas | camelCase, domain-named | `lib/validations/auth.ts` |

---

## Import Alias

```json
// tsconfig.json
"@/*" → "./*"
```

```ts
import HomePage from '@/src/views/HomePage'
import { fetchMenu } from '@/src/services/menuService'
import { formatPrice } from '@/src/utils/formatPrice'
import { useCartStore } from '@/src/lib/store/cartStore'
import { getSession } from '@/lib/auth'          // server only
import { prisma } from '@/lib/prisma'             // server only
```

---

## Key Boundaries

| From | Can import | Cannot import |
|---|---|---|
| `src/components/` | `src/lib/`, `src/utils/`, `src/lib/types/` | `src/services/`, `lib/` |
| `src/views/` | `src/components/`, `src/services/`, `src/lib/` | `lib/` |
| `src/services/` | `src/lib/types/` | `lib/` |
| `app/api/**/route.ts` | `lib/`, `src/lib/types/` | `src/components/`, `src/views/` |
| `lib/` | other `lib/` files | `src/` |
