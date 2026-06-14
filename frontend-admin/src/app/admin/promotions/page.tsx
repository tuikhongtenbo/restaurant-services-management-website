"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Table, Tag, message, Modal, Switch, Tooltip, Space, Card } from "antd";
import { Plus, Edit, Trash2, TicketPercent, CheckCircle, XCircle } from "lucide-react";
import dayjs from "dayjs";
import { voucherService } from "@/services/voucher.service";
import { Voucher } from "@/types/voucher";
import { VoucherFormModal } from "@/components/admin/promotions/VoucherFormModal";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function PromotionsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await voucherService.getAllVouchers({
        page: currentPage - 1,
        size: pageSize,
      });
      // Handle nested data structures correctly
      const pageData = res.data;
      setVouchers(pageData.content || []);
      setTotalElements(pageData.totalElements || 0);
    } catch (error: any) {
      message.error(error.message || "Lỗi tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (values: any) => {
    try {
      setSubmitting(true);
      if (selectedVoucher) {
        await voucherService.updateVoucher(selectedVoucher.id, values);
        message.success("Cập nhật khuyến mãi thành công");
      } else {
        await voucherService.createVoucher(values);
        message.success("Tạo khuyến mãi mới thành công");
      }
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, checked: boolean) => {
    try {
      await voucherService.toggleActive(id);
      message.success(`Đã ${checked ? 'bật' : 'tắt'} voucher`);
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Không thể thay đổi trạng thái");
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa khuyến mãi này không? Sau khi xóa sẽ không thể khôi phục.",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await voucherService.deleteVoucher(id);
          message.success("Xóa khuyến mãi thành công");
          fetchData();
        } catch (error: any) {
          message.error(error.message || "Lỗi khi xóa khuyến mãi");
        }
      },
    });
  };

  const activeCount = vouchers.filter(v => v.isActive).length;

  const columns = [
    {
      title: "Mã Khuyến Mãi",
      dataIndex: "code",
      key: "code",
      render: (text: string) => (
        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
          {text}
        </span>
      ),
    },
    {
      title: "Mức giảm",
      key: "discount",
      render: (_: any, record: Voucher) => (
        <span className="font-semibold text-green-600">
          {record.discountType === "PERCENT" 
            ? `${record.discountValue}%` 
            : formatPrice(record.discountValue)}
        </span>
      ),
    },
    {
      title: "Điều kiện",
      key: "condition",
      render: (_: any, record: Voucher) => (
        <div className="flex flex-col text-xs text-zinc-500">
          {record.minOrderValue ? <span>Đơn từ: {formatPrice(record.minOrderValue)}</span> : null}
          {record.minTier && record.minTier !== 'MEMBER' ? <span>Hạng: {record.minTier}</span> : null}
        </div>
      ),
    },
    {
      title: "Thời hạn",
      key: "validity",
      render: (_: any, record: Voucher) => {
        if (!record.validFrom && !record.validUntil) return <span className="text-zinc-400">Không giới hạn</span>;
        
        const from = record.validFrom ? dayjs(record.validFrom).format("DD/MM/YY") : "...";
        const to = record.validUntil ? dayjs(record.validUntil).format("DD/MM/YY") : "...";
        
        const isExpired = record.validUntil && dayjs().isAfter(dayjs(record.validUntil));
        
        return (
          <div className="flex flex-col text-xs">
            <span>{from} - {to}</span>
            {isExpired && <span className="text-red-500 font-medium">Hết hạn</span>}
          </div>
        );
      },
    },
    {
      title: "Lượt dùng",
      key: "usage",
      render: (_: any, record: Voucher) => {
        const isFull = record.usageLimit && (record.usedCount || 0) >= record.usageLimit;
        return (
          <span className={`text-sm ${isFull ? 'text-red-500 font-medium' : 'text-zinc-600'}`}>
            {record.usedCount || 0} / {record.usageLimit ? record.usageLimit : '∞'}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "isActive",
      render: (_: any, record: Voucher) => (
        <Switch
          checked={record.isActive}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right" as const,
      render: (_: any, record: Voucher) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit size={16} className="text-blue-500" />}
              onClick={() => {
                setSelectedVoucher(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <h1 className="text-2xl font-bold text-zinc-800 flex items-center gap-2 mb-1">
            <TicketPercent className="text-blue-600" />
            Khuyến mãi
          </h1>
          <p className="text-zinc-500 text-sm">Quản lý mã giảm giá và voucher</p>
        </div>
        
        <Card className="rounded-xl shadow-sm border-zinc-200" styles={{ body: { padding: "16px" } }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <TicketPercent size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-0">Tổng mã đang có</p>
              <h3 className="text-xl font-bold text-zinc-800 mb-0">{totalElements}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="rounded-xl shadow-sm border-zinc-200" styles={{ body: { padding: "16px" } }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-0">Đang hoạt động</p>
              <h3 className="text-xl font-bold text-zinc-800 mb-0">{activeCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl shadow-sm border-zinc-200" styles={{ body: { padding: "16px" } }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-0">Đang tạm dừng</p>
              <h3 className="text-xl font-bold text-zinc-800 mb-0">{vouchers.length - activeCount}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-zinc-200">
        <div className="flex gap-2">
          {/* Add filters here if needed later */}
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          className="flex items-center bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setSelectedVoucher(null);
            setModalOpen(true);
          }}
        >
          Tạo Khuyến Mãi
        </Button>
      </div>

      {/* Data Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <Table
          columns={columns}
          dataSource={vouchers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalElements,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          className="admin-table"
        />
      </div>

      {/* Form Modal */}
      <VoucherFormModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialValues={selectedVoucher}
        loading={submitting}
      />
    </div>
  );
}