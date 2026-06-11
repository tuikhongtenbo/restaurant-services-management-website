"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Table, Tag, message, Tooltip, Space, Input } from "antd";
import { Plus, Edit, Trash2, ContactRound, Search, Coins, History, UserCheck, UserX } from "lucide-react";
import { customerService } from "@/services/customer.service";
import { Customer } from "@/types/customer";
import { CustomerFormModal } from "@/components/admin/customers/CustomerFormModal";
import { AdjustPointsModal } from "@/components/admin/customers/AdjustPointsModal";
import { CustomerTransactionsModal } from "@/components/admin/customers/CustomerTransactionsModal";
import { UserStatus } from "@/types/user";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Search
  const [searchPhone, setSearchPhone] = useState("");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [adjustPointsModalOpen, setAdjustPointsModalOpen] = useState(false);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (searchPhone.trim()) {
        const res = await customerService.searchCustomer(searchPhone);
        setCustomers(res.data || []);
        setTotalElements(res.data?.length || 0);
      } else {
        const res = await customerService.getAllCustomers({
          page: currentPage - 1,
          size: pageSize,
        });
        const pageData = res.data;
        setCustomers(pageData.content || []);
        setTotalElements(pageData.totalElements || 0);
      }
    } catch (error: any) {
      message.error(error.message || "Lỗi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchPhone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (values: any) => {
    try {
      setSubmitting(true);
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, values);
        message.success("Cập nhật thông tin thành công");
      } else {
        await customerService.createCustomer(values);
        message.success("Thêm khách hàng thành công");
      }
      setFormModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustPoints = async (values: { points: number; note: string }) => {
    if (!selectedCustomer) return;
    try {
      setSubmitting(true);
      await customerService.adjustPoints(selectedCustomer.id, values);
      message.success("Điều chỉnh điểm thành công");
      setAdjustPointsModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      const newStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await customerService.updateCustomerStatus(customer.id, newStatus as UserStatus);
      message.success(`Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản`);
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Không thể thay đổi trạng thái");
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'gold';
      case 'SILVER': return 'cyan';
      case 'BRONZE': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: "Họ và Tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: Customer) => (
        <div className="flex flex-col">
          <span className="font-bold text-zinc-800">{text}</span>
          <span className="text-xs text-zinc-500">{record.email || '—'}</span>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>,
    },
    {
      title: "Hạng",
      dataIndex: "tier",
      key: "tier",
      render: (tier: string) => <Tag color={getTierColor(tier)}>{tier}</Tag>,
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (val: number) => <span className="text-zinc-700">{formatPrice(val || 0)}</span>,
    },
    {
      title: "Điểm tích lũy",
      dataIndex: "currentPoints",
      key: "currentPoints",
      render: (val: number) => <span className="font-bold text-green-600">{val || 0}</span>,
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, record: Customer) => (
        <Tag color={record.status === 'ACTIVE' ? 'success' : 'error'}>
          {record.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right" as const,
      render: (_: any, record: Customer) => (
        <Space>
          <Tooltip title="Cộng/Trừ điểm">
            <Button
              type="text"
              icon={<Coins size={16} className="text-yellow-500" />}
              onClick={() => {
                setSelectedCustomer(record);
                setAdjustPointsModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Lịch sử điểm">
            <Button
              type="text"
              icon={<History size={16} className="text-purple-500" />}
              onClick={() => {
                setSelectedCustomer(record);
                setTransactionsModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit size={16} className="text-blue-500" />}
              onClick={() => {
                setSelectedCustomer(record);
                setFormModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title={record.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
            <Button
              type="text"
              danger={record.status === 'ACTIVE'}
              icon={record.status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} className="text-green-500" />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 flex items-center gap-2 mb-1">
            <ContactRound className="text-blue-600" />
            Khách hàng
          </h1>
          <p className="text-zinc-500 text-sm">Quản lý hội viên, hạng thẻ và điểm tích lũy</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-zinc-200">
        <div className="flex gap-2 w-1/3">
          <Input
            placeholder="Tìm kiếm theo số điện thoại..."
            prefix={<Search size={16} className="text-zinc-400" />}
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            allowClear
            className="w-full"
          />
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          className="flex items-center bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setSelectedCustomer(null);
            setFormModalOpen(true);
          }}
        >
          Thêm Khách Hàng
        </Button>
      </div>

      {/* Data Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={searchPhone ? false : {
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

      {/* Modals */}
      <CustomerFormModal
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialValues={selectedCustomer}
        loading={submitting}
      />
      <AdjustPointsModal
        open={adjustPointsModalOpen}
        onCancel={() => setAdjustPointsModalOpen(false)}
        onSubmit={handleAdjustPoints}
        customer={selectedCustomer}
        loading={submitting}
      />
      <CustomerTransactionsModal
        open={transactionsModalOpen}
        onCancel={() => setTransactionsModalOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
