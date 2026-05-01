import AdminLoginPage from '@/src/views/admin/AdminLoginPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập — Quản trị Bánh Cá Bốn Mùa',
  description: 'Trang đăng nhập dành cho quản trị viên và nhân viên.',
};

export default function Page() {
  return <AdminLoginPage />;
}
