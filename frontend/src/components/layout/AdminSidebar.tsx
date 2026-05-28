"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, UtensilsCrossed, Table2, ShoppingBag,
  BarChart3, Users, Tag, UserCircle, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { key: "/admin/dashboard", label: "Tổng quan", icon: <LayoutDashboard size={18} /> },
  { key: "/admin/menu", label: "Thực đơn", icon: <UtensilsCrossed size={18} /> },
  { key: "/admin/table", label: "Quản lý Bàn", icon: <Table2 size={18} /> },
  { key: "/admin/order", label: "Đơn hàng", icon: <ShoppingBag size={18} /> },
  { key: "/admin/report", label: "Báo cáo", icon: <BarChart3 size={18} /> },
  { key: "/admin/users", label: "Nhân sự", icon: <Users size={18} /> },
  { key: "/admin/promotions", label: "Khuyến mãi", icon: <Tag size={18} /> },
  { key: "/admin/customers", label: "Khách hàng", icon: <UserCircle size={18} /> },
];

const bottomNav: NavItem[] = [
  { key: "/admin/notifications", label: "Thông báo", icon: <Bell size={18} /> },
  { key: "/admin/settings", label: "Cài đặt", icon: <Settings size={18} /> },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export default function AdminSidebar({ collapsed, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.key || pathname.startsWith(item.key + "/");
    return (
      <button
        onClick={() => router.push(item.key)}
        title={collapsed ? item.label : undefined}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-150 cursor-pointer group
          ${isActive
            ? "bg-blue-50 text-blue-600"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }
        `}
      >
        <span className={`flex-shrink-0 ${isActive ? "text-blue-600" : "text-zinc-500 group-hover:text-zinc-700"}`}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className="truncate">{item.label}</span>
        )}
        {isActive && !collapsed && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
        )}
      </button>
    );
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-zinc-100 flex flex-col z-30 transition-all duration-300"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-100 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 truncate">Restaurant</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center mx-auto">
            <UtensilsCrossed size={14} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => onCollapse(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 py-3 space-y-0.5 border-t border-zinc-100">
        {bottomNav.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}

        {/* User card */}
        <div className={`mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer group`}>
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
            A
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">Admin User</p>
              <p className="text-[11px] text-zinc-500 truncate">admin@restaurant.com</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => router.push("/login")}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-200 text-zinc-400 transition-all"
              title="Đăng xuất"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => onCollapse(false)}
          className="absolute -right-3 top-[72px] w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center shadow-sm hover:bg-zinc-50 transition-colors"
        >
          <ChevronRight size={12} className="text-zinc-500" />
        </button>
      )}
    </aside>
  );
}
