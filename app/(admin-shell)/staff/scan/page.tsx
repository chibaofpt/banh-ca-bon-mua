import StaffScanPage from '@/src/views/staff/StaffScanPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quét QR — Bánh Cá Bốn Mùa',
  description: 'Quét mã QR voucher hoặc thông tin khách hàng.',
};

export default function Page() {
  return <StaffScanPage />;
}
