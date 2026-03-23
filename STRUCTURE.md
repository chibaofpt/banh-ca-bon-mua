# Project Structure Skill — Bánh Cá Bốn Mùa

## Stack
- Next.js 14 App Router
- TypeScript strict
- Tailwind CSS
- Zustand (cart state)

## Folder Structure

app/
  layout.tsx                    # root layout, fonts, metadata
  page.tsx                      # entry — imports từ views/HomePage
  menu/
    page.tsx                    # entry — imports từ views/MenuPage

src/
  views/                        # full page compositions
    HomePage.tsx                # ghép VideoHero + IntroSection
    MenuPage.tsx                # ghép tabs + card grid + modal

  components/                   # UI thuần, không có business logic
    common/                     # dùng lại toàn app
      Button.tsx
      Badge.tsx
      Modal.tsx
      Drawer.tsx
    home/                       # chỉ dùng trong HomePage
      VideoHero.tsx
      IntroSection.tsx
      FeatureCard.tsx
    menu/                       # chỉ dùng trong MenuPage
      MenuCard.tsx
      ProductModal.tsx
      CartButton.tsx
      CartDrawer.tsx
      TabBar.tsx

  services/                     # gọi API hoặc fetch data
    menuService.ts              # fetch menu.json, sau này → /api/menu
    cartService.ts              # buildZaloMessage, future: POST /api/orders

  context/                      # global state
    CartContext.tsx             # Zustand store wrapper nếu cần Provider
    
  lib/
    store/
      cartStore.ts              # Zustand cart store
    hooks/
      useScrollProgress.ts
      useBodyScrollLock.ts
    types/
      menu.ts                   # DailyItem, SeasonalItem, Addon, MenuData
      cart.ts                   # CartItem, CartStore

  utils/
    formatPrice.ts              # formatPrice(price) → "🐟 {price} cá"
    deriveTags.ts               # extract tags từ description
    buildZaloMessage.ts         # build pre-fill string từ cart items

public/
  data/
    menu.json
  demo.mp4

## Pattern Rules

### app/page.tsx — entry only
import HomePage from '@/src/views/HomePage'
export default function Page() { return <HomePage /> }

### app/menu/page.tsx — entry only  
import MenuPage from '@/src/views/MenuPage'
export default function Page() { return <MenuPage /> }

### pages/ — composition only
- Import components, services, hooks
- Handle page-level state (activeTab, selectedItem, loading)
- No JSX styling logic — delegate xuống components

### components/ — UI only
- Nhận props, render UI
- Không fetch data trực tiếp
- Không import từ services/

### services/ — data only
// services/menuService.ts
export const fetchMenu = async (): Promise<MenuData> => {
  const res = await fetch('/data/menu.json')
  return res.json()
}
// Khi có backend: đổi URL → '/api/menu', không đổi gì khác

### utils/ — pure functions only
- Không có side effects
- Không import React

### lib/hooks/ — browser logic
- useScrollProgress: scroll → 0-1 progress
- useBodyScrollLock: lock/unlock body scroll khi modal mở

## Naming Convention
- Pages: PascalCase + Page suffix (HomePage, MenuPage)
- Components: PascalCase (MenuCard, VideoHero)
- Services: camelCase + Service suffix (menuService, cartService)
- Hooks: camelCase + use prefix (useScrollProgress)
- Utils: camelCase (formatPrice, deriveTags)
- Types: camelCase (menu.ts, cart.ts)

## Import Alias
tsconfig: "@/*" → "./*"
Usage:
  import HomePage from '@/src/pages/HomePage'
  import { fetchMenu } from '@/src/services/menuService'
  import { formatPrice } from '@/src/utils/formatPrice'
  import { useCartStore } from '@/src/lib/store/cartStore'

## Agent Rules
- Không để business logic trong app/page.tsx hay app/menu/page.tsx
- Không fetch data trong components/ — fetch trong pages/ hoặc services/
- Không dùng inline styles — Tailwind only
- Không install UI libraries
- Không dùng `any` type
- Không run dev server sau khi xong
- Không open browser
- File nào quá 150 lines → tách ra
```

---

Lưu tên `STRUCTURE.md` rồi cho agent chạy:
```
Read STRUCTURE.md and CLAUDE.md.
Restructure the entire project to match STRUCTURE.md exactly.
Do not change any logic or UI — only reorganize files and fix imports.
Do NOT run dev server. Do NOT open browser.