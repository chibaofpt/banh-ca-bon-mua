import HomePage from '@/src/views/HomePage';

export const metadata = {
  title: 'Bánh Cá Bốn Mùa — Matcha & Bánh Cá Thủ Công',
  description: 'Thưởng thức vị matcha chuẩn Nhật giữa lòng Bình Dương. Bánh cá và matcha ceremonial grade đa dạng theo mùa.',
};

/**
 * app/(public)/page.tsx – Entry-only wrapper for the Home route.
 * Following the Pattern Rule: logic and styling are delegated to src/views/HomePage.
 */
export default function Page() {
  return <HomePage />;
}
