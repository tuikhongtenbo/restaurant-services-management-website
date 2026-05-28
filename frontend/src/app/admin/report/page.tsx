"use client";

import { useState } from "react";
import { Download, TrendingUp, ShoppingBag, Users, DollarSign } from "lucide-react";
import { mockRevenueByDay, mockTopDishes, formatCurrency } from "@/data/mock";

const periods = ["Hôm nay", "7 ngày", "30 ngày", "Tháng này"];
const maxRevenue = Math.max(...mockRevenueByDay.map((d) => d.revenue));

const peakHours = [
  { hour: "6h", value: 15 }, { hour: "7h", value: 30 }, { hour: "8h", value: 45 },
  { hour: "9h", value: 25 }, { hour: "10h", value: 20 }, { hour: "11h", value: 60 },
  { hour: "12h", value: 95 }, { hour: "13h", value: 80 }, { hour: "14h", value: 40 },
  { hour: "15h", value: 25 }, { hour: "16h", value: 30 }, { hour: "17h", value: 45 },
  { hour: "18h", value: 85 }, { hour: "19h", value: 100 }, { hour: "20h", value: 90 },
  { hour: "21h", value: 70 }, { hour: "22h", value: 40 },
];

export default function ReportPage() {
  const [activePeriod, setActivePeriod] = useState("7 ngày");
  const totalRevenue = mockRevenueByDay.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = mockRevenueByDay.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-3 h-8 text-xs font-medium rounded-lg transition-all ${
                activePeriod === p ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 h-9 px-4 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-600 text-sm font-medium rounded-lg transition-colors">
          <Download size={14} /> Xuất báo cáo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Tổng doanh thu", value: formatCurrency(totalRevenue), icon: <DollarSign size={16} className="text-blue-600" />, bg: "bg-blue-50", change: "+18.2%" },
          { label: "Tổng đơn hàng", value: totalOrders.toString(), icon: <ShoppingBag size={16} className="text-violet-600" />, bg: "bg-violet-50", change: "+12.5%" },
          { label: "Trung bình/đơn", value: formatCurrency(Math.round(totalRevenue / totalOrders)), icon: <TrendingUp size={16} className="text-emerald-600" />, bg: "bg-emerald-50", change: "+5.1%" },
          { label: "Khách mới", value: "89", icon: <Users size={16} className="text-amber-600" />, bg: "bg-amber-50", change: "-3.2%" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-zinc-500">{kpi.label}</p>
              <div className={`w-7 h-7 ${kpi.bg} rounded-lg flex items-center justify-center`}>{kpi.icon}</div>
            </div>
            <p className="text-xl font-bold text-zinc-900">{kpi.value}</p>
            <p className={`text-xs mt-1 font-medium ${kpi.change.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>{kpi.change} so với kỳ trước</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-5">Doanh thu theo ngày</h2>
          <div className="flex items-end gap-3 h-48">
            {mockRevenueByDay.map((day, i) => {
              const h = (day.revenue / maxRevenue) * 100;
              const isToday = i === mockRevenueByDay.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end" style={{ height: 160 }}>
                    <div className={`w-full rounded-t-lg transition-all group-hover:opacity-70 ${isToday ? "bg-blue-600" : "bg-zinc-200"}`} style={{ height: `${h}%` }} />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] whitespace-nowrap bg-zinc-900 text-white px-2 py-1 rounded-md shadow transition-opacity">
                      {formatCurrency(day.revenue)}
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400">{day.date}</span>
                  <span className="text-[10px] text-zinc-300">{day.orders} đơn</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top dishes */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Top món bán chạy</h2>
          <div className="space-y-4">
            {mockTopDishes.map((dish, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-4 ${i === 0 ? "text-amber-500" : "text-zinc-300"}`}>#{i + 1}</span>
                    <span className="text-xs font-medium text-zinc-800 truncate max-w-[130px]">{dish.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{dish.sold} phần</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${i === 0 ? "bg-blue-600" : "bg-zinc-300"}`} style={{ width: `${(dish.sold / mockTopDishes[0].sold) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak hours */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Giờ cao điểm</h2>
        <div className="flex items-end gap-1.5 h-24">
          {peakHours.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex items-end" style={{ height: 80 }}>
                <div
                  className={`w-full rounded-t transition-all ${h.value >= 80 ? "bg-blue-600" : h.value >= 50 ? "bg-blue-300" : "bg-zinc-150 bg-zinc-200"}`}
                  style={{ height: `${h.value}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-400">{h.hour}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400 mt-2">Giờ cao điểm: <span className="text-zinc-600 font-medium">19h - 21h</span></p>
      </div>
    </div>
  );
}
