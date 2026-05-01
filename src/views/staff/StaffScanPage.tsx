"use client";

import { QrCode } from "lucide-react";

// TODO: wire html5-qrcode → GET /api/staff/scan?token=xxx
// On voucher: show info → confirm → PATCH /api/staff/vouchers/[id]/redeem
// On user: show name + points_balance — read only

/** StaffScanPage — standalone QR scanning page for voucher redemption and customer lookup. */
export default function StaffScanPage() {
  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Quét QR</h1>
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3">
        <div className="aspect-square w-full max-w-xs bg-secondary/40 rounded-2xl flex items-center justify-center">
          <QrCode size={96} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Đưa mã QR của khách vào khung hình để tích điểm hoặc đổi voucher
        </p>
      </div>
    </div>
  );
}
