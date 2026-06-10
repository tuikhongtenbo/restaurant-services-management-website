"use client"

import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Dropdown, Avatar, Modal, Tag } from 'antd';
import {
  LayoutDashboard,
  MenuSquare,
  Table,
  CalendarDays,
  ReceiptText,
  Users,
  TicketPercent,
  Settings,
  LogOut,
  User as UserIcon,
  Menu as MenuIcon,
  UserSquare2
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { User as UserType } from '@/types/user';

const { Header, Sider, Content } = Layout;

const SIDEBAR_ITEMS = [
  { key: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: <Link href="/admin/dashboard">Dashboard</Link> },
  { key: '/admin/menus', icon: <MenuSquare size={18} />, label: <Link href="/admin/menus">Thực đơn</Link> },
  { key: '/admin/tables', icon: <Table size={18} />, label: <Link href="/admin/tables">Sơ đồ bàn</Link> },
  { key: '/admin/reservations', icon: <CalendarDays size={18} />, label: <Link href="/admin/reservations">Đặt bàn</Link> },
  { key: '/admin/orders', icon: <ReceiptText size={18} />, label: <Link href="/admin/orders">Đơn hàng</Link> },
  { key: '/admin/customers', icon: <UserSquare2 size={18} />, label: <Link href="/admin/customers">Khách hàng</Link> },
  { key: '/admin/users', icon: <Users size={18} />, label: <Link href="/admin/users">Nhân sự</Link> },
  { key: '/admin/promotions', icon: <TicketPercent size={18} />, label: <Link href="/admin/promotions">Khuyến mãi</Link> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authService.getCurrentUser();
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user in layout:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị nhà hàng không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        localStorage.removeItem("accessToken");
        router.push('/auth/login');
      }
    });
  };

  const userMenuItems = [
    {
      key: '1',
      label: 'Cài đặt cá nhân',
      icon: <Settings size={16} />,
      onClick: () => router.push('/admin/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      label: <span className="text-red-500">Đăng xuất</span>,
      icon: <LogOut size={16} className="text-red-500" />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={250}
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50 }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-800 sticky top-0 bg-[#001529] z-10">
          <h1 className={`text-white font-bold transition-all duration-300 ${collapsed ? 'text-sm' : 'text-xl'}`}>
            {collapsed ? 'RMN' : 'Restaurant Management'}
          </h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={SIDEBAR_ITEMS}
          className="mt-4"
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s ease' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
          className="flex justify-between items-center shadow-sm border-b border-gray-100"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer outline-none border-none bg-transparent flex items-center justify-center"
            >
              <MenuIcon size={20} />
            </button>
            <h2 className="text-lg font-semibold m-0 text-gray-800">Trang quản trị</h2>
          </div>

          <Dropdown menu={{ items: userMenuItems as any }} trigger={['hover']} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-gray-200 transition-all">
              <Avatar
                style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }}
                icon={!currentUser && <UserIcon size={16} />}
              >
                {currentUser && currentUser.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <span className="text-sm font-medium text-gray-700 pr-2">
                {currentUser ? currentUser.fullName : 'Đang tải...'}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
