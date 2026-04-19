import type { Metadata } from "next";
import Vouchers from "@/src/views/Vouchers";

export const metadata: Metadata = {
  title: "Ví Voucher – Bánh Cá Bốn Mùa",
  description: "Xem và sử dụng voucher của bạn tại Bánh Cá Bốn Mùa.",
};

/** Voucher wallet page — renders the Vouchers view component. */
export default function VouchersPage() {
  return <Vouchers />;
}
