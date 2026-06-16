import React, { useState, useEffect } from "react";
import { Modal, Table, Tag, message, Button } from "antd";
import { Order, OrderItem, OrderItemStatus } from "@/types/order";
import { orderService } from "@/services/order.service";
import { invoiceService } from "@/services/invoice.service";

interface OrderDetailModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onRefresh: () => void;
}

const itemStatusConfig: Record<OrderItemStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "processing" },
  PREPARING: { label: "Đang nấu", color: "warning" },
  READY: { label: "Sẵn sàng", color: "cyan" },
  SERVED: { label: "Đã phục vụ", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  open,
  order,
  onClose,
  onRefresh,
}) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  useEffect(() => {
    if (open && order) {
      fetchOrderItems();
    } else {
      setOrderItems([]);
    }
  }, [open, order]);

  const fetchOrderItems = async () => {
    if (!order) return;
    try {
      setLoadingItems(true);
      const res = await orderService.getOrderItems(order.id);
      setOrderItems(res.data);
    } catch (error: any) {
      message.error("Lỗi tải danh sách món.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewInvoice = async () => {
    if (!order) return;
    try {
      const res = await invoiceService.getInvoiceByOrderId(order.id);
      if (res.data) {
        const html = await invoiceService.printInvoice(res.data.id);
        setInvoiceHtml(html);
        setInvoiceModalOpen(true);
      }
    } catch (error: any) {
      message.error(error.message || "Không thể lấy hoá đơn.");
    }
  };

  if (!order) return null;



  const activeItems = orderItems.filter((i) => i.status !== "CANCELLED");
  const subtotal = activeItems.reduce((sum, i) => sum + i.totalPrice, 0);

  const columns = [
    {
      title: "Món",
      key: "itemName",
      render: (_: any, record: OrderItem) => (
        <div>
          <span className="font-medium text-zinc-800">{record.itemName}</span>
          {record.note && <p className="text-xs text-zinc-400 mt-0.5">📝 {record.note}</p>}
        </div>
      ),
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
      align: "center" as const,
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      render: (v: number) => formatPrice(v),
    },
    {
      title: "Thành tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 120,
      render: (v: number) => <span className="font-semibold">{formatPrice(v)}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: OrderItemStatus, record: OrderItem) => {
        const cfg = itemStatusConfig[status];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-3">
            <span>Đơn hàng — Bàn {order.tableNumber || "?"}</span>
            <Tag color={order.status === "OPEN" ? "processing" : order.status === "PAID" ? "success" : "error"}>
              {order.status === "OPEN" ? "Đang mở" : order.status === "PAID" ? "Đã thanh toán" : "Đã hủy"}
            </Tag>
          </div>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={780}
      >
        <div className="space-y-4 mt-2">
          {/* Info row */}
          <div className="flex gap-6 text-sm text-zinc-500">
            {order.guestCount && <span>👥 {order.guestCount} khách</span>}
            {order.waiterName && <span>🧑‍🍳 {order.waiterName}</span>}
            <span>🕐 {new Date(order.openedAt).toLocaleString("vi-VN")}</span>
          </div>

          {/* Items table */}
          <Table
            columns={columns}
            dataSource={orderItems}
            rowKey="id"
            loading={loadingItems}
            pagination={false}
            size="small"
            rowClassName={(record) => (record.status === "CANCELLED" ? "opacity-40 line-through" : "")}
          />

          {/* Subtotal */}
          <div className="flex justify-between items-center pr-2 mt-4">
            <div>
              {order.status === "PAID" && (
                <Button type="primary" onClick={handleViewInvoice}>
                  Xem hoá đơn
                </Button>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-zinc-500 text-sm">Tạm tính:</span>
              <span className="text-xl font-bold text-zinc-900">{formatPrice(subtotal)}</span>
            </div>
          </div>


        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        title="Hoá đơn"
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {invoiceHtml && (
          <iframe
            srcDoc={invoiceHtml}
            style={{ width: "100%", height: "70vh", border: "none" }}
            title="Invoice"
          />
        )}
      </Modal>
    </>
  );
};
