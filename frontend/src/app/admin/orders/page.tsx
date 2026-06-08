"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Table, Tag, DatePicker, Tabs, message, Spin, Card, Space, Tooltip } from "antd";
import { RefreshCw, Eye, Clock, DollarSign, ShoppingCart, XCircle } from "lucide-react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { orderService } from "@/services/order.service";
import { Order, OrderStatus } from "@/types/order";
import { OrderDetailModal } from "@/components/admin/orders/OrderDetailModal";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  OPEN: { label: "Đang mở", color: "processing" },
  PAID: { label: "Đã thanh toán", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalElements, setTotalElements] = useState(0);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const statusParam = selectedStatus === "ALL" ? undefined : (selectedStatus as OrderStatus);
      const dateStr = selectedDate.format("YYYY-MM-DD");

      const res = await orderService.getOrders({
        status: statusParam,
        date: dateStr,
        page: currentPage - 1,
        size: pageSize,
      });

      // Response structure: ApiResponse<PageResponse<Order[]>>
      // So data is at res.data
      const pageData = res.data;
      setOrders(pageData.data);
      setTotalElements(pageData.totalElements);
    } catch (error: any) {
      message.error(error.message || "Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => fetchData(true);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  // Stats
  const openCount = orders.filter((o) => o.status === "OPEN").length;
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;
  const totalRevenue = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + o.subtotal, 0);

  const columns = [
    {
      title: "Bàn",
      key: "table",
      width: 100,
      render: (_: any, record: Order) => (
        <span className="font-bold text-zinc-800 text-base">
          {record.tableNumber || "—"}
        </span>
      ),
    },
    {
      title: "Thời gian mở",
      dataIndex: "openedAt",
      key: "openedAt",
      width: 160,
      render: (val: string) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{dayjs(val).format("HH:mm")}</span>
          <span className="text-xs text-zinc-400">{dayjs(val).format("DD/MM/YYYY")}</span>
        </div>
      ),
    },
    {
      title: "Số khách",
      dataIndex: "guestCount",
      key: "guestCount",
      width: 90,
      align: "center" as const,
      render: (val: number) => val || "—",
    },
    {
      title: "Số món",
      key: "itemCount",
      width: 90,
      align: "center" as const,
      render: (_: any, record: Order) => (
        <span className="text-zinc-600">{record.items?.length || 0}</span>
      ),
    },
    {
      title: "Tạm tính",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 140,
      render: (val: number) => (
        <span className="font-semibold text-zinc-800">{formatPrice(val)}</span>
      ),
    },
    {
      title: "Nhân viên",
      dataIndex: "waiterName",
      key: "waiterName",
      width: 130,
      render: (val: string) => val || <span className="text-zinc-300">—</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: OrderStatus) => {
        const cfg = statusConfig[status];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center" as const,
      render: (_: any, record: Order) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<Eye size={18} />}
            onClick={() => handleViewOrder(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Đơn hàng</h1>
          <p className="text-zinc-500 mt-1">Theo dõi các đơn hàng theo ngày và trạng thái</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            value={selectedDate}
            onChange={(d) => { if (d) { setSelectedDate(d); setCurrentPage(1); } }}
            format="DD/MM/YYYY"
            allowClear={false}
            className="w-40"
            size="large"
          />
          <Button
            icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
            size="large"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="bg-blue-50/50 border-blue-100">
          <div className="text-blue-600 text-sm font-medium flex items-center gap-1.5">
            <ShoppingCart size={14} /> Đang mở
          </div>
          <div className="text-2xl font-bold mt-1 text-blue-700">{openCount}</div>
        </Card>
        <Card size="small" className="bg-emerald-50/50 border-emerald-100">
          <div className="text-emerald-600 text-sm font-medium flex items-center gap-1.5">
            <DollarSign size={14} /> Đã thanh toán
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{paidCount}</div>
        </Card>
        <Card size="small" className="bg-rose-50/50 border-rose-100">
          <div className="text-rose-600 text-sm font-medium flex items-center gap-1.5">
            <XCircle size={14} /> Đã hủy
          </div>
          <div className="text-2xl font-bold mt-1 text-rose-700">{cancelledCount}</div>
        </Card>
        <Card size="small" className="bg-amber-50/50 border-amber-100">
          <div className="text-amber-600 text-sm font-medium flex items-center gap-1.5">
            <DollarSign size={14} /> Doanh thu
          </div>
          <div className="text-xl font-bold mt-1 text-amber-700">{formatPrice(totalRevenue)}</div>
        </Card>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Tabs
          activeKey={selectedStatus}
          onChange={(key) => { setSelectedStatus(key); setCurrentPage(1); }}
          items={[
            { key: "ALL", label: "Tất cả" },
            { key: "OPEN", label: "Đang mở" },
            { key: "PAID", label: "Đã thanh toán" },
            { key: "CANCELLED", label: "Đã hủy" },
          ]}
          className="px-4 pt-4"
        />

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalElements,
            onChange: (p, s) => { setCurrentPage(p); setPageSize(s); },
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn`,
          }}
          className="border-t border-zinc-100"
          onRow={(record) => ({
            className: "cursor-pointer hover:bg-zinc-50 transition-colors",
            onClick: () => handleViewOrder(record),
          })}
        />
      </div>

      {/* Detail Modal */}
      <OrderDetailModal
        open={detailOpen}
        order={selectedOrder}
        onClose={() => setDetailOpen(false)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}