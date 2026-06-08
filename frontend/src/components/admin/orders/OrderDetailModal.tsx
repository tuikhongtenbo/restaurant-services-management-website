import React, { useState, useEffect } from "react";
import { Modal, Table, Tag, Button, InputNumber, Input, Form, Popconfirm, message, Empty, Spin, Select, Space } from "antd";
import { Plus, Minus, Trash2, MessageSquare, Search } from "lucide-react";
import { Order, OrderItem, OrderItemStatus, AddOrderItemRequest } from "@/types/order";
import { MenuItem } from "@/types/menu";
import { orderService } from "@/services/order.service";
import { menuService } from "@/services/menu.service";

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
  const [actionLoading, setActionLoading] = useState(false);

  // Add item state
  const [showAddItem, setShowAddItem] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addNote, setAddNote] = useState("");

  // Cancel item
  const [cancelItemId, setCancelItemId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (open && order) {
      fetchOrderItems();
    } else {
      setOrderItems([]);
      setShowAddItem(false);
      setSelectedMenuItem(null);
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

  const handleOpenAddItem = async () => {
    setShowAddItem(true);
    if (menuItems.length === 0) {
      try {
        setLoadingMenu(true);
        const res = await menuService.getItems({ status: "AVAILABLE", size: 200 });
        setMenuItems(res.data.content);
      } catch {
        message.error("Lỗi tải thực đơn.");
      } finally {
        setLoadingMenu(false);
      }
    }
  };

  const handleAddItem = async () => {
    if (!order || !selectedMenuItem) return;
    try {
      setActionLoading(true);
      const payload: AddOrderItemRequest = {
        itemId: selectedMenuItem.id,
        quantity: addQty,
        note: addNote || undefined,
      };
      await orderService.addItem(order.id, payload);
      message.success(`Đã thêm ${selectedMenuItem.name} x${addQty}`);
      setSelectedMenuItem(null);
      setAddQty(1);
      setAddNote("");
      setShowAddItem(false);
      fetchOrderItems();
      onRefresh();
    } catch (error: any) {
      message.error(error.message || "Lỗi thêm món.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelItem = async (itemId: string) => {
    if (!order || !cancelReason.trim()) {
      message.warning("Vui lòng nhập lý do hủy.");
      return;
    }
    try {
      setActionLoading(true);
      await orderService.cancelItem(order.id, itemId, { reason: cancelReason });
      message.success("Đã hủy món.");
      setCancelItemId(null);
      setCancelReason("");
      fetchOrderItems();
      onRefresh();
    } catch (error: any) {
      message.error(error.message || "Lỗi hủy món.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseOrder = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      await orderService.closeOrder(order.id);
      message.success("Đã đóng đơn hàng thành công.");
      onClose();
      onRefresh();
    } catch (error: any) {
      message.error(error.message || "Lỗi đóng đơn.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!order) return null;

  const filteredMenu = menuItems.filter(
    (m) => m.name.toLowerCase().includes(searchText.toLowerCase()) || m.category.toLowerCase().includes(searchText.toLowerCase())
  );

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
      width: 120,
      render: (status: OrderItemStatus) => {
        const cfg = itemStatusConfig[status];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    ...(order.status === "OPEN"
      ? [
          {
            title: "",
            key: "action",
            width: 50,
            render: (_: any, record: OrderItem) =>
              record.status === "PENDING" ? (
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={() => setCancelItemId(record.id)}
                />
              ) : null,
          },
        ]
      : []),
  ];

  return (
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
        <div className="flex justify-end items-baseline gap-2 pr-2">
          <span className="text-zinc-500 text-sm">Tạm tính:</span>
          <span className="text-xl font-bold text-zinc-900">{formatPrice(subtotal)}</span>
        </div>

        {/* Cancel item modal inline */}
        {cancelItemId && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-rose-700 mb-2">Nhập lý do hủy món:</p>
            <div className="flex gap-2">
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách đổi ý..."
                className="flex-1"
              />
              <Button danger loading={actionLoading} onClick={() => handleCancelItem(cancelItemId)}>
                Xác nhận Hủy
              </Button>
              <Button onClick={() => { setCancelItemId(null); setCancelReason(""); }}>Thoát</Button>
            </div>
          </div>
        )}

        {/* Add item section */}
        {order.status === "OPEN" && !showAddItem && (
          <Button type="dashed" block icon={<Plus size={16} />} onClick={handleOpenAddItem}>
            Thêm món vào đơn
          </Button>
        )}

        {showAddItem && (
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-800">Thêm món vào đơn</p>
              <Button size="small" type="text" onClick={() => setShowAddItem(false)}>
                Đóng
              </Button>
            </div>

            <Input
              prefix={<Search size={14} className="text-zinc-400" />}
              placeholder="Tìm kiếm theo tên hoặc danh mục..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            {loadingMenu ? (
              <Spin size="small" />
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredMenu.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMenuItem(m)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMenuItem?.id === m.id
                        ? "bg-blue-100 border border-blue-300"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt={m.name} className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-800">{m.name}</p>
                        <p className="text-xs text-zinc-400">{m.category}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-zinc-700">{formatPrice(m.promoPrice || m.price)}</span>
                  </div>
                ))}
                {filteredMenu.length === 0 && (
                  <p className="text-center text-zinc-400 text-sm py-4">Không tìm thấy món ăn.</p>
                )}
              </div>
            )}

            {selectedMenuItem && (
              <div className="flex items-center gap-3 pt-2 border-t border-blue-100">
                <span className="text-sm font-medium text-zinc-700 flex-1">
                  {selectedMenuItem.name}
                </span>
                <InputNumber min={1} value={addQty} onChange={(v) => setAddQty(v || 1)} size="small" className="w-16" />
                <Input
                  placeholder="Ghi chú..."
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  size="small"
                  className="w-40"
                />
                <Button type="primary" size="small" loading={actionLoading} onClick={handleAddItem}>
                  Thêm
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Close Order */}
        {order.status === "OPEN" && (
          <div className="flex justify-end pt-2">
            <Popconfirm
              title="Đóng đơn hàng?"
              description="Đơn sẽ chuyển sang trạng thái ĐÃ THANH TOÁN và bàn chuyển sang DỌN DẸP."
              onConfirm={handleCloseOrder}
              okText="Đóng đơn"
              cancelText="Hủy"
            >
              <Button type="primary" danger size="large" loading={actionLoading}>
                Đóng đơn & Thanh toán
              </Button>
            </Popconfirm>
          </div>
        )}
      </div>
    </Modal>
  );
};
