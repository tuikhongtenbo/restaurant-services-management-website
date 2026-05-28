"use client";

import { useState } from "react";
import { UserPlus, Search } from "lucide-react";
import { Table, Tag, Input, Button, Avatar } from "antd";
import type { ColumnsType } from "antd/es/table";
import { mockStaff, Staff, StaffRole } from "@/data/mock";

const roleConfig: Record<StaffRole, { label: string; color: string }> = {
  ADMIN: { label: "Quản trị viên", color: "purple" },
  MANAGER: { label: "Quản lý", color: "blue" },
  CASHIER: { label: "Thu ngân", color: "cyan" },
  WAITER: { label: "Phục vụ", color: "orange" },
  CHEF: { label: "Đầu bếp", color: "volcano" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Đang làm việc", color: "success" },
  OFF: { label: "Nghỉ ca", color: "default" },
  ON_LEAVE: { label: "Nghỉ phép", color: "warning" },
};

const avatarColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f97316", "#ec4899", "#06b6d4", "#f43f5e"];

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockStaff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnsType<Staff> = [
    {
      title: "Nhân viên",
      dataIndex: "name",
      key: "name",
      render: (text, record, index) => (
        <div className="flex items-center gap-3">
          <Avatar style={{ backgroundColor: avatarColors[index % avatarColors.length] }}>
            {record.avatar}
          </Avatar>
          <div>
            <p className="font-medium text-zinc-900 leading-tight">{text}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Chức vụ",
      dataIndex: "role",
      key: "role",
      render: (role: StaffRole) => (
        <Tag color={roleConfig[role].color} className="border-0 font-medium">{roleConfig[role].label}</Tag>
      ),
    },
    {
      title: "Ca làm việc",
      dataIndex: "shift",
      key: "shift",
      responsive: ["md"],
      render: (text) => <span className="text-zinc-600">{text}</span>,
    },
    {
      title: "Ngày vào làm",
      dataIndex: "joinDate",
      key: "joinDate",
      responsive: ["lg"],
      render: (date) => <span className="text-zinc-600">{new Date(date).toLocaleDateString("vi-VN")}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => {
        const conf = statusConfig[status];
        return <Tag color={conf.color} className="border-0 font-medium m-0">{conf.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      render: () => (
        <div className="flex justify-end gap-2">
          <Button type="link" size="small" className="px-0">Xem</Button>
          <Button type="text" size="small">Sửa</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <Input
          prefix={<Search size={15} className="text-zinc-400" />}
          placeholder="Tìm nhân viên (tên, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
          allowClear
        />
        <Button type="primary" icon={<UserPlus size={14} />} className="h-9">
          Thêm nhân viên
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 shrink-0">
        {[
          { label: "Tổng nhân viên", value: mockStaff.length },
          { label: "Đang làm việc", value: mockStaff.filter((s) => s.status === "ACTIVE").length },
          { label: "Nghỉ phép", value: mockStaff.filter((s) => s.status === "ON_LEAVE").length },
          { label: "Ca sáng", value: mockStaff.filter((s) => s.shift.includes("Sáng")).length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-100 px-4 py-3">
            <p className="text-xl font-bold text-zinc-900">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-100 flex-1 overflow-hidden flex flex-col">
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{
            pageSize: 8,
            showTotal: (total) => `Tổng ${total} nhân viên`,
            className: "px-4 pb-4 mb-0",
          }}
          scroll={{ y: "calc(100vh - 350px)" }}
          className="flex-1"
        />
      </div>
    </div>
  );
}
