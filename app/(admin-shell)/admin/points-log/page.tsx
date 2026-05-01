import AdminPointsLogPage from '@/src/views/admin/AdminPointsLogPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điểm & Voucher — Quản trị Bánh Cá Bốn Mùa',
  description: 'Quản lý lịch sử điểm và voucher.',
};

export default function Page() {
  return <AdminPointsLogPage />;
}
