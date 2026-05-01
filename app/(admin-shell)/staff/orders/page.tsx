import StaffOrdersPage from '@/src/views/staff/StaffOrdersPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tạo đơn — Bánh Cá Bốn Mùa',
  description: 'Tạo đơn hàng mới tại quầy.',
};

export default function Page() {
  return <StaffOrdersPage />;
}
