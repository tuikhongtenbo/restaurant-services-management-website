"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, ChevronDown } from "lucide-react";
import { mockNotifications } from "@/data/mock";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Tổng quan",
  "/admin/menu": "Thực đơn",
  "/admin/table": "Quản lý Bàn",
  "/admin/order": "Đơn hàng",
  "/admin/report": "Báo cáo",
  "/admin/users": "Nhân sự",
  "/admin/promotions": "Khuyến mãi",
  "/admin/customers": "Khách hàng",
  "/admin/notifications": "Thông báo",
  "/admin/settings": "Cài đặt",
};

interface AdminHeaderProps {
  collapsed: boolean;
  onCollapse: () => void;
}

export default function AdminHeader({ collapsed: _collapsed, onCollapse: _onCollapse }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] ?? "Trang quản lý";
  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20">
      {/* Left: page title */}
      <div>
        <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
        <p className="text-xs text-zinc-500 hidden sm:block">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 h-9 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-400 cursor-pointer hover:bg-zinc-100 transition-colors min-w-[180px]">
          <Search size={14} />
          <span>Tìm kiếm...</span>
          <span className="ml-auto text-[11px] bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded font-mono">⌘K</span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => router.push("/admin/notifications")}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
          )}
        </button>

        {/* User */}
        <button className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-lg hover:bg-zinc-100 transition-colors">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
            A
          </div>
          <span className="text-sm font-medium text-zinc-700 hidden sm:block">Admin</span>
          <ChevronDown size={14} className="text-zinc-400" />
        </button>
      </div>
    </header>
  );
}
