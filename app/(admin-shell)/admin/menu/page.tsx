import AdminMenuPage from '@/src/views/admin/AdminMenuPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sản phẩm — Quản trị Bánh Cá Bốn Mùa',
  description: 'Quản lý danh sách sản phẩm và addon.',
};

export default function Page() {
  return <AdminMenuPage />;
}
