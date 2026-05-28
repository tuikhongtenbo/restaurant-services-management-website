"use client";

import { mockTables, RestaurantTable, TableStatus } from "@/data/mock";
import { Users, Clock } from "lucide-react";

const statusConfig: Record<TableStatus, { label: string; dot: string; card: string; badge: string }> = {
  AVAILABLE: { label: "Trống", dot: "bg-emerald-500", card: "border-zinc-100 hover:border-emerald-200 hover:shadow-md", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OCCUPIED: { label: "Đang phục vụ", dot: "bg-blue-500", card: "border-blue-100 bg-blue-50/30", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  RESERVED: { label: "Đã đặt trước", dot: "bg-amber-500", card: "border-amber-100 bg-amber-50/20", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  CLEANING: { label: "Đang dọn dẹp", dot: "bg-zinc-400", card: "border-zinc-100 opacity-70", badge: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

const areas = ["Tất cả", "Trong nhà", "Ngoài trời", "VIP"];

export default function TablePage() {
  const stats = {
    available: mockTables.filter((t) => t.status === "AVAILABLE").length,
    occupied: mockTables.filter((t) => t.status === "OCCUPIED").length,
    reserved: mockTables.filter((t) => t.status === "RESERVED").length,
    cleaning: mockTables.filter((t) => t.status === "CLEANING").length,
  };

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bàn trống", value: stats.available, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Đang phục vụ", value: stats.occupied, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Đã đặt", value: stats.reserved, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Đang dọn", value: stats.cleaning, color: "text-zinc-500", bg: "bg-zinc-100" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Area filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {areas.map((a) => (
          <button key={a} className="px-3 h-8 text-xs font-medium rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 first:bg-zinc-900 first:text-white first:border-zinc-900">
            {a}
          </button>
        ))}
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {mockTables.map((table) => (
          <TableCard key={table.id} table={table} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(statusConfig).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`w-2 h-2 rounded-full ${v.dot}`} />
            {v.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableCard({ table }: { table: RestaurantTable }) {
  const sc = statusConfig[table.status];
  return (
    <div className={`bg-white rounded-xl border p-3.5 cursor-pointer transition-all ${sc.card}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-zinc-400 font-medium">Bàn</p>
          <p className="text-xl font-bold text-zinc-900">{table.number}</p>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${sc.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      </div>

      <div className="flex items-center gap-1 text-xs text-zinc-400 mb-3">
        <Users size={11} />
        <span>{table.capacity} chỗ</span>
        <span className="mx-1">·</span>
        <span>{table.area}</span>
      </div>

      {table.status === "OCCUPIED" && table.occupiedSince && (
        <div className="flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 rounded-md px-2 py-1 mb-2">
          <Clock size={10} />
          <span>Từ {table.occupiedSince}</span>
        </div>
      )}

      {table.status === "RESERVED" && table.reservedFor && (
        <div className="text-[10px] text-amber-700 bg-amber-50 rounded-md px-2 py-1 mb-2 truncate">
          {table.reservedFor}
        </div>
      )}

      <div className="flex gap-1.5 mt-1">
        {table.status === "AVAILABLE" && (
          <button className="flex-1 h-6 text-[11px] font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors">
            Mở bàn
          </button>
        )}
        {table.status === "OCCUPIED" && (
          <button className="flex-1 h-6 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Xem đơn
          </button>
        )}
        {table.status === "RESERVED" && (
          <button className="flex-1 h-6 text-[11px] font-medium bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors">
            Check-in
          </button>
        )}
        {table.status === "CLEANING" && (
          <button className="flex-1 h-6 text-[11px] font-medium bg-zinc-100 text-zinc-600 rounded-md hover:bg-zinc-200 transition-colors">
            Hoàn thành
          </button>
        )}
        <button className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-md text-zinc-500 text-[11px] transition-colors">
          ···
        </button>
      </div>
    </div>
  );
}
