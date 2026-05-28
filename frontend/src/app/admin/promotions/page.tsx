"use client";

import { Plus, Copy, Tag } from "lucide-react";
import { mockVouchers, Voucher, VoucherStatus, formatCurrency } from "@/data/mock";

const statusConfig: Record<VoucherStatus, { label: string; cls: string; dot: string }> = {
  ACTIVE: { label: "Đang hoạt động", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  EXPIRED: { label: "Hết hạn", cls: "bg-zinc-100 text-zinc-500 border-zinc-200", dot: "bg-zinc-400" },
  USED: { label: "Đã dùng hết", cls: "bg-blue-50 text-blue-600 border-blue-200", dot: "bg-blue-500" },
};

function VoucherCard({ v }: { v: Voucher }) {
  const sc = statusConfig[v.status];
  const usedPct = Math.round((v.usedCount / v.maxUse) * 100);
  return (
    <div className={`bg-white rounded-xl border p-5 transition-all ${v.status === "ACTIVE" ? "border-zinc-100 hover:shadow-md" : "border-zinc-100 opacity-70"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Tag size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">{v.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <code className="text-sm font-bold text-zinc-900 tracking-wide">{v.code}</code>
              <button className="text-zinc-400 hover:text-zinc-600 transition-colors" title="Sao chép">
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${sc.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      </div>

      <div className="text-2xl font-bold text-zinc-900 mb-1">
        {v.discountType === "PERCENT" ? `${v.discount}%` : formatCurrency(v.discount)}
        <span className="text-sm font-normal text-zinc-400 ml-1">giảm</span>
      </div>
      <p className="text-xs text-zinc-500 mb-3">Đơn tối thiểu {formatCurrency(v.minOrder)}{v.maxDiscount ? ` · Giảm tối đa ${formatCurrency(v.maxDiscount)}` : ""}</p>

      {/* Usage bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>Đã dùng</span>
          <span>{v.usedCount}/{v.maxUse}</span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${usedPct >= 80 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${usedPct}%` }} />
        </div>
      </div>

      <p className="text-xs text-zinc-400">Hết hạn: {new Date(v.expiresAt).toLocaleDateString("vi-VN")}</p>

      <div className="flex gap-2 mt-4">
        <button className="flex-1 h-7 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors">Sửa</button>
        {v.status === "ACTIVE" && (
          <button className="flex-1 h-7 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">Vô hiệu hóa</button>
        )}
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const active = mockVouchers.filter((v) => v.status === "ACTIVE");
  const inactive = mockVouchers.filter((v) => v.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 h-7 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg flex items-center">{active.length} đang hoạt động</div>
          <div className="px-3 h-7 bg-zinc-100 text-zinc-500 text-xs font-medium rounded-lg flex items-center">{inactive.length} đã kết thúc</div>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> Tạo mã giảm giá
        </button>
      </div>

      {active.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Đang hoạt động</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((v) => <VoucherCard key={v.id} v={v} />)}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Đã kết thúc</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactive.map((v) => <VoucherCard key={v.id} v={v} />)}
          </div>
        </div>
      )}
    </div>
  );
}
