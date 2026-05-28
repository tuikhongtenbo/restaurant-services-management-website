"use client";

import { useState } from "react";
import { ShoppingBag, CreditCard, Settings, Users, Calendar, Bell, CheckCheck } from "lucide-react";
import { mockNotifications, Notification } from "@/data/mock";

const typeConfig: Record<Notification["type"], { icon: React.ReactNode; bg: string }> = {
  ORDER: { icon: <ShoppingBag size={14} />, bg: "bg-blue-100 text-blue-600" },
  PAYMENT: { icon: <CreditCard size={14} />, bg: "bg-emerald-100 text-emerald-600" },
  SYSTEM: { icon: <Settings size={14} />, bg: "bg-zinc-100 text-zinc-600" },
  STAFF: { icon: <Users size={14} />, bg: "bg-violet-100 text-violet-600" },
  RESERVATION: { icon: <Calendar size={14} />, bg: "bg-amber-100 text-amber-600" },
};

const filters = ["Tất cả", "Chưa đọc", "Đơn hàng", "Thanh toán", "Hệ thống"];

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

  const filtered = notifications.filter((n) => {
    if (activeFilter === "Tất cả") return true;
    if (activeFilter === "Chưa đọc") return !n.isRead;
    if (activeFilter === "Đơn hàng") return n.type === "ORDER";
    if (activeFilter === "Thanh toán") return n.type === "PAYMENT";
    if (activeFilter === "Hệ thống") return n.type === "SYSTEM";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700">{unreadCount} chưa đọc</span>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <CheckCheck size={13} /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 h-8 text-xs font-medium rounded-lg transition-all ${
              activeFilter === f ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {filtered.map((n) => {
          const tc = typeConfig[n.type];
          return (
            <div
              key={n.id}
              onClick={() => setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item))}
              className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${n.isRead ? "bg-white border border-zinc-100 hover:bg-zinc-50/50" : "bg-blue-50/40 border border-blue-100 hover:bg-blue-50/60"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.bg}`}>
                {tc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.isRead ? "text-zinc-700" : "text-zinc-900"}`}>{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  {new Date(n.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-zinc-400">
            <Bell size={28} className="mb-2 opacity-40" />
            <p className="text-sm">Không có thông báo</p>
          </div>
        )}
      </div>
    </div>
  );
}
