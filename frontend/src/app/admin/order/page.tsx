"use client";

import { useState } from "react";
import { Download, Search, ShoppingBag } from "lucide-react";
import { Table, Tag, Input, Select, Button, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { mockOrders, formatCurrency, Order, OrderStatus } from "@/data/mock";

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "warning" },
  SERVING: { label: "Đang phục vụ", color: "processing" },
  PAID: { label: "Đã thanh toán", color: "success" },
  VOIDED: { label: "Đã hủy", color: "error" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

export default function OrderPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = mockOrders.filter((o) => {
    const matchStatus = activeFilter === "ALL" || o.status === activeFilter;
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.waiter.toLowerCase().includes(search.toLowerCase()) ||
      String(o.tableNumber).includes(search);
    return matchStatus && matchSearch;
  });

  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center">
            <ShoppingBag size={13} className="text-zinc-500" />
          </div>
          <span className="font-medium text-zinc-900">{text}</span>
        </div>
      ),
    },
    {
      title: "Bàn",
      dataIndex: "tableNumber",
      key: "tableNumber",
      render: (val) => <span className="text-zinc-600">Bàn {val}</span>,
    },
    {
      title: "Nhân viên",
      dataIndex: "waiter",
      key: "waiter",
      responsive: ["md"],
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["lg"],
      render: (val) => new Date(val).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (val) => <span className="font-semibold text-zinc-900">{formatCurrency(val)}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: OrderStatus) => {
        const conf = statusConfig[status];
        return <Tag color={conf.color} className="border-0 font-medium m-0 px-2 py-0.5">{conf.label}</Tag>;
      },
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Input
          prefix={<Search size={15} className="text-zinc-400" />}
          placeholder="Tìm mã đơn, nhân viên, số bàn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
          allowClear
        />
        <Select
          value={activeFilter}
          onChange={setActiveFilter}
          className="w-40 h-9"
          options={[
            { label: "Tất cả", value: "ALL" },
            { label: "Chờ xử lý", value: "PENDING" },
            { label: "Đang phục vụ", value: "SERVING" },
            { label: "Đã thanh toán", value: "PAID" },
            { label: "Đã hủy", value: "VOIDED" },
          ]}
        />
        <Button icon={<Download size={14} />} className="ml-auto h-9">
          Xuất
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-100 flex-1 overflow-hidden flex flex-col">
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{
            pageSize: 8,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
            className: "px-4 pb-4 mb-0",
          }}
          onRow={(record) => ({
            onClick: () => setSelectedOrder(record),
            className: "cursor-pointer",
          })}
          scroll={{ y: "calc(100vh - 280px)" }}
          className="flex-1"
        />
      </div>

      {/* Modal */}
      <Modal
        title={
          <div>
            <h3 className="font-semibold text-zinc-900">{selectedOrder?.orderNumber}</h3>
            <p className="text-xs text-zinc-500 font-normal">Bàn {selectedOrder?.tableNumber} · {selectedOrder?.waiter}</p>
          </div>
        }
        onCancel={() => setSelectedOrder(null)}
        open={!!selectedOrder}
        footer={null}
        width={400}
      >
        {selectedOrder && (
          <div className="flex flex-col">
            <div className="flex-1 mt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-zinc-700">Trạng thái</span>
                <Tag color={statusConfig[selectedOrder.status].color} className="border-0 font-medium m-0">{statusConfig[selectedOrder.status].label}</Tag>
              </div>

              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Chi tiết món</p>
              <div className="space-y-3">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-zinc-100 rounded text-center text-xs font-medium text-zinc-600 flex items-center justify-center">{item.qty}</span>
                      <span className="text-zinc-700">{item.name}</span>
                    </div>
                    <span className="text-zinc-900 font-medium">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 mt-6">
              <div className="flex justify-between text-sm font-bold text-zinc-900 mb-6">
                <span>Tổng cộng</span>
                <span className="text-blue-600 text-lg">{formatCurrency(selectedOrder.total)}</span>
              </div>
              
              <div className="flex gap-2">
                {selectedOrder.status === "SERVING" && (
                  <Button type="primary" className="flex-1 h-10 bg-emerald-600 hover:!bg-emerald-700">
                    Thanh toán
                  </Button>
                )}
                {selectedOrder.status === "PENDING" && (
                  <>
                    <Button type="primary" className="flex-1 h-10">Xác nhận</Button>
                    <Button danger className="flex-1 h-10">Hủy đơn</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
