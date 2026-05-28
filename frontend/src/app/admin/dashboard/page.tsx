"use client";

import { TrendingUp, TrendingDown, ShoppingBag, Table2, Users, DollarSign, ArrowRight, Clock } from "lucide-react";
import { mockOrders, mockRevenueByDay, mockTopDishes, mockTables, formatCurrency } from "@/data/mock";
import { useRouter } from "next/navigation";

const kpiCards = [
  {
    label: "Doanh thu hôm nay",
    value: "6,400,000₫",
    change: "+12.5%",
    up: true,
    sub: "So với hôm qua",
    icon: <DollarSign size={18} className="text-blue-600" />,
    bg: "bg-blue-50",
  },
  {
    label: "Đơn hàng",
    value: "47",
    change: "+5%",
    up: true,
    sub: "So với hôm qua",
    icon: <ShoppingBag size={18} className="text-violet-600" />,
    bg: "bg-violet-50",
  },
  {
    label: "Bàn đang phục vụ",
    value: `${mockTables.filter((t) => t.status === "OCCUPIED").length} / ${mockTables.length}`,
    change: "",
    up: true,
    sub: "Công suất hiện tại",
    icon: <Table2 size={18} className="text-emerald-600" />,
    bg: "bg-emerald-50",
  },
  {
    label: "Khách mới hôm nay",
    value: "15",
    change: "-2.1%",
    up: false,
    sub: "So với hôm qua",
    icon: <Users size={18} className="text-amber-600" />,
    bg: "bg-amber-50",
  },
];

const maxRevenue = Math.max(...mockRevenueByDay.map((d) => d.revenue));

export default function DashboardPage() {
  const router = useRouter();
  const recentOrders = mockOrders.slice(0, 5);

  const statusConfig: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    SERVING: { label: "Đang phục vụ", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    PAID: { label: "Đã thanh toán", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    VOIDED: { label: "Đã hủy", cls: "bg-red-50 text-red-600 border-red-200" },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm text-zinc-500 font-medium">{card.label}</p>
              <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{card.value}</p>
            <div className="flex items-center gap-1.5 text-xs">
              {card.change && (
                <>
                  {card.up
                    ? <TrendingUp size={12} className="text-emerald-500" />
                    : <TrendingDown size={12} className="text-red-500" />}
                  <span className={card.up ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                    {card.change}
                  </span>
                </>
              )}
              <span className="text-zinc-400">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-zinc-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Doanh thu 7 ngày qua</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Tổng: {formatCurrency(mockRevenueByDay.reduce((s, d) => s + d.revenue, 0))}</p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {mockRevenueByDay.map((day, i) => {
              const heightPct = (day.revenue / maxRevenue) * 100;
              const isToday = i === mockRevenueByDay.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end" style={{ height: 120 }}>
                    <div
                      className={`w-full rounded-t-md transition-all group-hover:opacity-80 ${isToday ? "bg-blue-600" : "bg-zinc-200"}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] text-zinc-600 whitespace-nowrap bg-white border border-zinc-200 px-1.5 py-0.5 rounded shadow-sm transition-opacity">
                      {formatCurrency(day.revenue)}
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top dishes */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Món bán chạy nhất</h2>
          <div className="space-y-3">
            {mockTopDishes.map((dish, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-300 w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-800 truncate">{dish.name}</p>
                  <div className="mt-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(dish.sold / mockTopDishes[0].sold) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-zinc-500 flex-shrink-0">{dish.sold}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-zinc-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Đơn hàng gần đây</h2>
          <button
            onClick={() => router.push("/admin/order")}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Xem tất cả <ArrowRight size={12} />
          </button>
        </div>
        <div className="divide-y divide-zinc-50">
          {recentOrders.map((order) => {
            const sc = statusConfig[order.status] ?? statusConfig.PENDING;
            return (
              <div key={order.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50/50 transition-colors">
                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={14} className="text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{order.orderNumber}</p>
                  <p className="text-xs text-zinc-500">Bàn {order.tableNumber} · {order.waiter}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${sc.cls} hidden sm:inline`}>
                  {sc.label}
                </span>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-zinc-900">{formatCurrency(order.total)}</p>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1 justify-end">
                    <Clock size={10} />
                    {new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}