"use client";

import { useState } from "react";
import { Crown, Search } from "lucide-react";
import { Table, Input, Segmented, Avatar, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { mockCustomers, Customer, formatCurrency } from "@/data/mock";

const avatarColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#ec4899"];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "VIP">("ALL");

  const filtered = mockCustomers.filter((c) => {
    const matchType = filter === "ALL" || (filter === "VIP" && c.isVip);
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    return matchType && matchSearch;
  });

  const columns: ColumnsType<Customer> = [
    {
      title: "Khách hàng",
      dataIndex: "name",
      key: "name",
      render: (text, record, index) => (
        <div className="flex items-center gap-3">
          <Avatar style={{ backgroundColor: avatarColors[index % avatarColors.length] }}>
            {text.charAt(0)}
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-zinc-900 leading-tight">{text}</p>
              {record.isVip && <Crown size={12} className="text-amber-500" />}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{record.email || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      responsive: ["sm"],
      render: (text) => <span className="text-zinc-600">{text}</span>,
    },
    {
      title: "Điểm tích lũy",
      dataIndex: "points",
      key: "points",
      align: "right",
      responsive: ["md"],
      sorter: (a, b) => a.points - b.points,
      render: (val) => <span className="font-medium text-blue-600">{val.toLocaleString()} pts</span>,
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      align: "right",
      responsive: ["lg"],
      sorter: (a, b) => a.totalSpent - b.totalSpent,
      render: (val) => <span className="font-medium text-zinc-700">{formatCurrency(val)}</span>,
    },
    {
      title: "Đơn hàng",
      dataIndex: "totalOrders",
      key: "totalOrders",
      align: "center",
      responsive: ["md"],
      sorter: (a, b) => a.totalOrders - b.totalOrders,
      render: (val) => <span className="text-zinc-600">{val}</span>,
    },
    {
      title: "Lần cuối",
      dataIndex: "lastVisit",
      key: "lastVisit",
      responsive: ["lg"],
      render: (val) => <span className="text-zinc-500 text-xs">{new Date(val).toLocaleDateString("vi-VN")}</span>,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      render: () => (
        <Button type="link" size="small" className="px-0">Xem chi tiết</Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Input
          prefix={<Search size={15} className="text-zinc-400" />}
          placeholder="Tìm tên, số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
          allowClear
        />
        <Segmented
          options={[
            { label: "Tất cả", value: "ALL" },
            { label: <div className="flex items-center gap-1"><Crown size={12} className="text-amber-500"/> VIP</div>, value: "VIP" },
          ]}
          value={filter}
          onChange={(val) => setFilter(val as "ALL" | "VIP")}
          className="p-1 h-9 flex items-center"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
        {[
          { label: "Tổng khách hàng", value: mockCustomers.length },
          { label: "Khách VIP", value: mockCustomers.filter((c) => c.isVip).length },
          { label: "Tổng điểm lưu thông", value: mockCustomers.reduce((s, c) => s + c.points, 0).toLocaleString() },
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
            showTotal: (total) => `Tổng ${total} khách hàng`,
            className: "px-4 pb-4 mb-0",
          }}
          scroll={{ y: "calc(100vh - 350px)" }}
          className="flex-1"
        />
      </div>
    </div>
  );
}
