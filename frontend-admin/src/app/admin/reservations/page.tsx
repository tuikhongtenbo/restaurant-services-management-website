"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, DatePicker, Tabs, Table, Tag, Popconfirm, message, Tooltip, Space, Card } from "antd";
import { Plus, Check, MapPin, XCircle, Edit, Calendar as CalendarIcon, Clock, Users, Phone, X } from "lucide-react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { reservationService } from "@/services/reservation.service";
import { authService } from "@/services/auth.service";
import { Reservation, ReservationStatus, ReservationCalendar } from "@/types/reservation";
import { ReservationFormModal } from "@/components/admin/reservations/ReservationFormModal";
import { ReservationCancelModal } from "@/components/admin/reservations/ReservationCancelModal";
import { tableService } from "@/services/table.service";

export default function ReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calendar Stats
  const [stats, setStats] = useState<ReservationCalendar | null>(null);

  // Tables Map for displaying Table Number
  const [tables, setTables] = useState<Record<string, string>>({});

  // Auth State
  const [staffId, setStaffId] = useState<string | undefined>(undefined);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | undefined>(undefined);
  const [cancelingReservation, setCancelingReservation] = useState<Reservation | null>(null);

  // Initialize
  useEffect(() => {
    authService.getCurrentUser().then(res => setStaffId(res.data.id)).catch(() => { });
    tableService.getTables({ size: 100 }).then(res => {
      const tableMap: Record<string, string> = {};
      res.data.content.forEach(t => tableMap[t.id] = t.number);
      setTables(tableMap);
    }).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.format("YYYY-MM-DD");

      // Fetch both list and calendar stats in parallel
      const statusParam = selectedStatus === "ALL" ? undefined : (selectedStatus as ReservationStatus);

      const [listRes, calendarRes] = await Promise.all([
        reservationService.getReservations({
          date: dateStr,
          status: statusParam,
          page: currentPage - 1, // Spring API is 0-indexed
          size: pageSize,
        }),
        reservationService.getCalendar(dateStr)
      ]);

      setData(listRes.content);
      setTotal(listRes.totalElements);
      setStats(calendarRes);
    } catch (error: any) {
      message.error(error.message || "Lỗi khi tải dữ liệu đặt bàn");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleConfirm = async (id: string) => {
    if (!staffId) return message.error("Không tìm thấy thông tin nhân viên.");
    try {
      await reservationService.confirmReservation(id, staffId);
      message.success("Đã duyệt đặt bàn thành công.");
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Không thể duyệt đặt bàn.");
    }
  };

  const handleArrived = async (id: string) => {
    try {
      await reservationService.markAsArrived(id);
      message.success("Đã đánh dấu khách đến.");
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Lỗi thao tác.");
    }
  };



  const handleDelete = async (id: string) => {
    try {
      await reservationService.deleteReservation(id);
      message.success("Đã xóa đặt bàn.");
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Lỗi thao tác.");
    }
  };

  const statusColors: Record<ReservationStatus, string> = {
    PENDING: "processing",
    CONFIRMED: "warning", // Yellow/Orange
    ARRIVED: "success",
    CANCELLED: "error",
    REJECTED: "error",
  };

  const statusLabels: Record<ReservationStatus, string> = {
    PENDING: "Chờ duyệt",
    CONFIRMED: "Đã duyệt",
    ARRIVED: "Đã đến",
    CANCELLED: "Đã hủy",
    REJECTED: "Từ chối",
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "reservedAt",
      key: "reservedAt",
      render: (val: string) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900">{dayjs(val).format("HH:mm")}</span>
          <span className="text-xs text-zinc-500">{dayjs(val).format("DD/MM/YYYY")}</span>
        </div>
      )
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: Reservation) => (
        <div className="flex flex-col">
          <span className="font-semibold">{record.customerName}</span>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Phone size={12} /> {record.customerPhone}
          </span>
        </div>
      )
    },
    {
      title: "Số khách",
      dataIndex: "partySize",
      key: "partySize",
      render: (val: number) => (
        <span className="flex items-center gap-1.5 font-medium">
          <Users size={16} className="text-zinc-400" /> {val}
        </span>
      )
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (val: string) => val ? <span className="text-zinc-600 text-sm truncate max-w-[150px] inline-block" title={val}>{val}</span> : <span className="text-zinc-300">-</span>
    },
    {
      title: "Bàn",
      dataIndex: "tableId",
      key: "tableId",
      render: (val: string) => val && tables[val] ? <Tag color="blue">Bàn {tables[val]}</Tag> : <span className="text-zinc-400 italic text-sm">Chưa xếp</span>
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ReservationStatus) => (
        <Tag color={statusColors[status] || "default"}>
          {statusLabels[status] || status}
        </Tag>
      )
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right" as const,
      render: (_: any, record: Reservation) => (
        <Space size="small">
          {record.status === "PENDING" && (
            <Popconfirm title="Duyệt đặt bàn này?" onConfirm={() => handleConfirm(record.id)}>
              <Button type="primary" size="small" icon={<Check size={14} />}>Duyệt</Button>
            </Popconfirm>
          )}

          {record.status === "CONFIRMED" && (() => {
            const reservedTime = dayjs(record.reservedAt);
            const now = dayjs();
            const thirtyMinsBefore = reservedTime.subtract(30, 'minute');
            const thirtyMinsAfter = reservedTime.add(30, 'minute');

            const canArrive = now.isAfter(thirtyMinsBefore) && now.isBefore(thirtyMinsAfter);

            let arriveTooltip = "";
            if (now.isBefore(thirtyMinsBefore)) arriveTooltip = "Chỉ được check-in trước giờ hẹn tối đa 30 phút";
            else if (now.isAfter(thirtyMinsAfter)) arriveTooltip = "Đã quá hạn 30 phút, đơn đang chờ hệ thống tự hủy";

            return (
              <Tooltip title={arriveTooltip}>
                <Popconfirm 
                  title="Khách đã đến quán?" 
                  onConfirm={() => handleArrived(record.id)}
                  disabled={!canArrive}
                >
                  <Button 
                    className={canArrive ? "bg-emerald-500 hover:bg-emerald-600 border-none" : ""} 
                    type="primary" 
                    size="small" 
                    icon={<MapPin size={14} />}
                    disabled={!canArrive}
                  >
                    Đã đến
                  </Button>
                </Popconfirm>
              </Tooltip>
            );
          })()}

          {(record.status === "PENDING" || record.status === "CONFIRMED") && (
            <>
              <Tooltip title="Chỉnh sửa">
                <Button size="small" type="text" icon={<Edit size={16} />} onClick={() => { setEditingReservation(record); setFormOpen(true); }} />
              </Tooltip>
              <Tooltip title="Hủy đơn">
                <Button size="small" danger type="text" icon={<X size={16} />} onClick={() => { setCancelingReservation(record); setCancelOpen(true); }} />
              </Tooltip>
            </>
          )}

          {record.status === "CANCELLED" && (
            <Popconfirm title="Xóa vĩnh viễn?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger type="text" icon={<XCircle size={16} />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Đặt bàn</h1>
          <p className="text-zinc-500 mt-1">Theo dõi và quản lý lịch hẹn của khách hàng</p>
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
            type="primary"
            size="large"
            icon={<Plus size={18} />}
            onClick={() => { setEditingReservation(undefined); setFormOpen(true); }}
          >
            Tạo đơn mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card size="small" className="bg-zinc-50 border-zinc-200">
          <div className="text-zinc-500 text-sm font-medium">Tổng trong ngày</div>
          <div className="text-2xl font-bold mt-1 text-zinc-800">{stats?.totalReservations || 0}</div>
        </Card>
        <Card size="small" className="bg-blue-50/50 border-blue-100">
          <div className="text-blue-600 text-sm font-medium">Chờ duyệt</div>
          <div className="text-2xl font-bold mt-1 text-blue-700">{stats?.pending || 0}</div>
        </Card>
        <Card size="small" className="bg-amber-50/50 border-amber-100">
          <div className="text-amber-600 text-sm font-medium">Đã duyệt</div>
          <div className="text-2xl font-bold mt-1 text-amber-700">{stats?.confirmed || 0}</div>
        </Card>
        <Card size="small" className="bg-emerald-50/50 border-emerald-100">
          <div className="text-emerald-600 text-sm font-medium">Đã đến</div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{stats?.arrived || 0}</div>
        </Card>
        <Card size="small" className="bg-rose-50/50 border-rose-100">
          <div className="text-rose-600 text-sm font-medium">Đã hủy</div>
          <div className="text-2xl font-bold mt-1 text-rose-700">{stats?.cancelled || 0}</div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Tabs
          activeKey={selectedStatus}
          onChange={(key) => { setSelectedStatus(key); setCurrentPage(1); }}
          items={[
            { key: "ALL", label: "Tất cả" },
            { key: "PENDING", label: "Chờ duyệt" },
            { key: "CONFIRMED", label: "Đã duyệt" },
            { key: "ARRIVED", label: "Đã đến" },
            { key: "CANCELLED", label: "Đã hủy" },
          ]}
          className="px-4 pt-4"
        />

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (p, s) => { setCurrentPage(p); setPageSize(s); },
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn`
          }}
          className="border-t border-zinc-100"
        />
      </div>

      {/* Modals */}
      <ReservationFormModal
        open={formOpen}
        initialData={editingReservation}
        onCancel={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); fetchData(); }}
        staffId={staffId}
      />

      <ReservationCancelModal
        open={cancelOpen}
        reservation={cancelingReservation}
        onCancel={() => setCancelOpen(false)}
        onSuccess={() => { setCancelOpen(false); fetchData(); }}
        staffId={staffId}
      />
    </div>
  );
}