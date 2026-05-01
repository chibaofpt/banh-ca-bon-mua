# Bánh Cá Bốn Mùa — Project Structure

> Read this file before creating or moving any file or directory.

---

## Folder Layout

```
app/                              # Next.js App Router — entry points only, zero logic
  (public)/
    page.tsx                      # → src/views/HomePage
    menu/
      page.tsx                    # → src/views/MenuPage
  (auth)/
    login/
      page.tsx                    # → src/views/LoginPage
    register/
      page.tsx                    # → src/views/RegisterPage
  (customer)/                     # Phase 3+ — CUSTOMER role required
    profile/page.tsx
    orders/page.tsx
    orders/[id]/page.tsx
    points/page.tsx
    vouchers/page.tsx
  (admin-public)/
    admin/
      login/
        page.tsx                  # → src/views/admin/AdminLoginPage
  (admin-shell)/
    layout.tsx                    # Shared shell: top bar + bottom tab bar
    admin/                        # ADMIN only
      menu/page.tsx               # → src/views/admin/AdminMenuPage
      voucher-packages/page.tsx   # → src/views/admin/AdminVoucherPackagesPage
      points-log/page.tsx         # → src/views/admin/AdminPointsLogPage
    staff/                        # STAFF or ADMIN
      orders/page.tsx             # → src/views/staff/StaffOrdersPage
      orders-list/page.tsx        # → src/views/staff/StaffOrdersListPage
      scan/page.tsx               # → src/views/staff/StaffScanPage
  api/                            # Route handlers — delegate business logic to lib/
    auth/
      register/route.ts
      login/route.ts
      logout/route.ts
      refresh/route.ts
    menu/route.ts
    orders/route.ts
    orders/[id]/route.ts
    profile/route.ts
    profile/points/route.ts
    profile/vouchers/route.ts
    profile/vouchers/redeem/route.ts
    staff/orders/route.ts
    staff/scan/route.ts
    staff/vouchers/[id]/redeem/route.ts
    admin/points/add/route.ts
    admin/orders/[id]/status/route.ts
    admin/menu/route.ts
    admin/menu/[id]/route.ts
    admin/addon-groups/route.ts
    admin/addon-groups/[id]/route.ts
    admin/menu-item-addons/route.ts
    admin/voucher-packages/route.ts
    admin/voucher-packages/[id]/route.ts
    admin/points-log/route.ts
    admin/points-log/[id]/reverse/route.ts
    admin/promotions/route.ts     # Phase 5 only

src/                              # Frontend — never import lib/ from here
  views/
    HomePage.tsx
    MenuPage.tsx
    LoginPage.tsx
    RegisterPage.tsx
    ProfilePage.tsx               # Phase 3
    OrdersPage.tsx                # Phase 3
    PointsPage.tsx                # Phase 4
    VouchersPage.tsx              # Phase 4
    admin/
      AdminLoginPage.tsx
      AdminMenuPage.tsx
      AdminVoucherPackagesPage.tsx
      AdminPointsLogPage.tsx
    staff/
      StaffOrdersPage.tsx
      StaffOrdersListPage.tsx
      StaffScanPage.tsx
  components/
    common/
      Button.tsx
      Badge.tsx
      Modal.tsx
      Drawer.tsx
    home/
      VideoHero.tsx
      IntroSection.tsx
      FeatureCard.tsx
    menu/
      MenuCard.tsx
      ProductModal.tsx
      CartButton.tsx
      CartDrawer.tsx
      TabBar.tsx
    auth/
      PhoneInput.tsx
      PasswordInput.tsx
    admin/
      MenuItemForm.tsx
      MenuItemCard.tsx
      VoucherPackageForm.tsx
      PointsLogTable.tsx
    staff/
      StaffMenuCard.tsx
      StaffCartDrawer.tsx
      StaffOrderForm.tsx
      AddonModal.tsx
      QRScannerModal.tsx
      OrderCard.tsx
  services/
    menuService.ts
    orderService.ts               # Phase 3
    authService.ts
    profileService.ts             # Phase 3
    voucherService.ts             # Phase 4
    adminMenuService.ts
    adminVoucherService.ts
    adminPointsService.ts
    adminOrderService.ts
    staffOrderService.ts
    staffOrdersListService.ts
    staffScanService.ts
  lib/
    api/
      client.ts                   # Single Axios instance — always import from here
    store/
      cartStore.ts                # Zustand cart — localStorage persisted
    hooks/
      useScrollProgress.ts
      useBodyScrollLock.ts
    types/
      api.ts                      # ApiResponse<T>, ApiError
      menu.ts
      cart.ts
      order.ts                    # Phase 3
      user.ts
  utils/
    formatPrice.ts                # formatPrice(vnd: number) → "🐟 {vnd/1000} cá" — input is VND integer
    deriveTags.ts
    buildZaloMessage.ts

public/
  data/
    menu.json                     # Static — replaced by /api/menu in Phase 2
  demo.mp4

lib/                              # Backend only — server-side, NEVER import in src/
  prisma.ts
  auth.ts                         # signJwt, verifyJwt, getSession
  sms.ts
  storage.ts                      # Supabase Storage helpers — bucket: menu-images
  validations/
    auth.ts
    menu.ts
    order.ts
    voucher.ts
    points.ts

middleware.ts
prisma/schema.prisma
.env.local
.env.local.example
```

---

## Layer Rules

| Layer | Rule |
|---|---|
| `app/**/page.tsx` | Entry only — import view component, export metadata, no logic |
| `src/views/` | Composition — import components + services + hooks. No direct fetch calls. |
| `src/components/` | UI only — receive props, render. No fetching, no importing services/lib. |
| `src/services/` | Only layer that knows API URLs. Use `apiClient` from `src/lib/api/client.ts`. |
| `lib/` | Backend only. Never import inside `src/`. |
| `app/api/**/route.ts` | Validate with Zod → delegate to `lib/` → return standard shape |

---

## Import Boundaries

| From | Can import | Cannot import |
|---|---|---|
| `src/components/` | `src/lib/types/`, `src/utils/` | `src/services/`, `lib/` |
| `src/views/` | `src/components/`, `src/services/`, `src/lib/` | `lib/` |
| `src/services/` | `src/lib/types/`, `src/lib/api/client` | `lib/` |
| `app/api/**/route.ts` | `lib/`, `src/lib/types/` | `src/components/`, `src/views/` |
| `lib/` | other `lib/` files | `src/` |

---

## Import Alias

```json
// tsconfig.json
"@/*" → "./*"
```

```ts
import HomePage          from '@/src/views/HomePage'
import { fetchMenu }     from '@/src/services/menuService'
import { formatPrice }   from '@/src/utils/formatPrice'
import { useCartStore }  from '@/src/lib/store/cartStore'
import { apiClient }     from '@/src/lib/api/client'
import { getSession }    from '@/lib/auth'     // server only
import { prisma }        from '@/lib/prisma'   // server only
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Views | PascalCase + Page suffix | `HomePage`, `AdminMenuPage` |
| Components | PascalCase | `MenuCard`, `OrderCard` |
| Services | camelCase + Service suffix | `menuService`, `staffScanService` |
| Hooks | camelCase + use prefix | `useScrollProgress` |
| Utils | camelCase | `formatPrice` |
| Type files | camelCase | `menu.ts`, `cart.ts` |
| Route handlers | `route.ts` | Next.js convention |
| Zod schemas | camelCase, domain-named | `lib/validations/auth.ts` |
