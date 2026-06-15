"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Modal, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { Customer, PointTransaction } from "@/types/customer";
import { customerService } from "@/services/customer.service";

interface CustomerTransactionsModalProps {
  open: boolean;
  onCancel: () => void;
  customer: Customer | null;
}

export const CustomerTransactionsModal: React.FC<CustomerTransactionsModalProps> = ({
  open,
  onCancel,
  customer,
}) => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchTransactions = useCallback(async () => {
    if (!customer?.id) return;
    try {
      setLoading(true);
      const res = await customerService.getCustomerTransactions(customer.id, {
        page: currentPage - 1,
        size: pageSize,
      });
      const pageData = res.data;
      setTransactions(pageData.content || []);
      setTotalElements(pageData.totalElements || 0);
    } catch (error: any) {
      message.error(error.message || "Lỗi tải lịch sử giao dịch");
    } finally {
      setLoading(false);
    }
  }, [customer?.id, currentPage, pageSize]);

  useEffect(() => {
    if (open) {
      fetchTransactions();
    } else {
      // Reset state when closed
      setTransactions([]);
      setCurrentPage(1);
      setTotalElements(0);
    }
  }, [open, fetchTransactions]);

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Loại giao dịch",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        switch (type) {
          case 'EARN': return <Tag color="success">Tích điểm</Tag>;
          case 'REDEEM': return <Tag color="warning">Tiêu điểm</Tag>;
          case 'ADJUST': return <Tag color="blue">Điều chỉnh</Tag>;
          default: return <Tag>{type}</Tag>;
        }
      },
    },
    {
      title: "Điểm",
      dataIndex: "points",
      key: "points",
      render: (points: number) => {
        const isPositive = points > 0;
        return (
          <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? `+${points}` : points}
          </span>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note: string) => <span className="text-sm text-zinc-600">{note || '—'}</span>,
    },
  ];

  return (
    <Modal
      title={`Lịch sử giao dịch điểm: ${customer?.fullName}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <div className="mt-4">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalElements,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
          }}
          size="small"
        />
      </div>
    </Modal>
  );
};
