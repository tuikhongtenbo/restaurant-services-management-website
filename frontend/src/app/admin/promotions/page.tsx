"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Input, Tag, Space, Popconfirm, message, Switch, Tooltip } from "antd";
import { Plus, Search, Edit, Trash2, RefreshCw } from "lucide-react";
import { voucherService } from "@/services/voucher.service";
import { Voucher } from "@/types/voucher";
import { VoucherFormModal } from "@/components/admin/promotions/VoucherFormModal";
import dayjs from "dayjs";

export default function PromotionsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchText, setSearchText] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | undefined>(undefined);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await voucherService.getAllVouchers({
        page: currentPage - 1,
        size: pageSize,
      });

      setVouchers(res.data.content);
      setTotalElements(res.data.totalElements);
    } catch (error: any) {
      message.error(error.message || "Lỗi khi tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleCreateNew = () => {
    setEditingVoucher(undefined);
    setFormOpen(true);
  };

  const handleEdit = (record: Voucher) => {
    setEditingVoucher(record);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    fetchData(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      await voucherService.toggleActive(id);
      message.success("Cập nhật trạng thái thành công");
      fetchData(true);
    } catch (error: any) {
      message.error(error.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await voucherService.deleteVoucher(id);
      message.success("Đã xóa voucher");
      fetchData(true);
    } catch (error: any) {
      message.error(error.message || "Lỗi khi xóa voucher");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (val: string) => <span className="font-semibold text-blue-600">{val}</span>,
    },
    {
      title: "Mức giảm",
      key: "discount",
      render: (_: any, record: Voucher) => (
        <span className="font-medium text-emerald-600">
          {record.discountType === "PERCENT" ? `${record.discountValue}%` : formatCurrency(record.discountValue)}
        </span>
      ),
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "minOrderValue",
      key: "minOrderValue",
      render: (val: number) => val ? formatCurrency(val) : <span className="text-gray-400">Không yêu cầu</span>,
    },
    {
      title: "Lượt dùng",
      key: "usage",
      render: (_: any, record: Voucher) => (
        <span>
          {record.usedCount} / {record.usageLimit || <span className="text-gray-400">∞</span>}
        </span>
      ),
    },
    {
      title: "Hạng áp dụng",
      dataIndex: "minTier",
      key: "minTier",
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          MEMBER: "default",
          BRONZE: "orange",
          SILVER: "purple",
          GOLD: "gold",
        };
        return <Tag color={colorMap[val] || "default"}>{val}</Tag>;
      },
    },
    {
      title: "Hạn sử dụng",
      key: "validity",
      render: (_: any, record: Voucher) => {
        if (!record.validFrom && !record.validUntil) return <span className="text-gray-400">Vô thời hạn</span>;
        return (
          <div className="text-xs">
            <div>Từ: {record.validFrom ? dayjs(record.validFrom).format("DD/MM/YY HH:mm") : "-"}</div>
            <div>Đến: {record.validUntil ? dayjs(record.validUntil).format("DD/MM/YY HH:mm") : "-"}</div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (val: boolean, record: Voucher) => (
        <Switch 
          checked={val} 
          onChange={() => handleToggleActive(record.id)} 
          checkedChildren="Bật" 
          unCheckedChildren="Tắt" 
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      render: (_: any, record: Voucher) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit size={16} className="text-blue-500" />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa voucher này?"
            description="Voucher đã xóa sẽ không thể phục hồi. Vẫn tiếp tục?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<Trash2 size={16} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Khuyến mãi</h1>
          <p className="text-zinc-500 mt-1">Danh sách voucher, mã giảm giá và chiến dịch khuyến mãi</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Tìm theo mã..."
            prefix={<Search size={16} className="text-zinc-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-64"
            allowClear
          />
          <Button
            icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleCreateNew}
          >
            Thêm Voucher
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Table
          dataSource={vouchers.filter(v => v.code.toLowerCase().includes(searchText.toLowerCase()))}
          columns={columns}
          rowKey="id"
          loading={loading && !refreshing}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalElements,
            onChange: (p, s) => { setCurrentPage(p); setPageSize(s); },
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} voucher`,
          }}
        />
      </div>

      <VoucherFormModal
        open={formOpen}
        initialData={editingVoucher}
        onCancel={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}