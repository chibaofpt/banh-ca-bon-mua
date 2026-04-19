import MenuPage from '@/src/views/MenuPage';

export const metadata = {
  title: 'Thực đơn — Bánh Cá Bốn Mùa',
  description: 'Khám phá thực đơn bánh cá nướng và trà matcha đặc trưng của Bánh Cá Bốn Mùa.',
};

/**
 * app/(public)/menu/page.tsx – Entry-only wrapper for the Menu route.
 * Following the Pattern Rule: logic and styling are delegated to src/views/MenuPage.
 */
export default function Page() {
  return <MenuPage />;
}
