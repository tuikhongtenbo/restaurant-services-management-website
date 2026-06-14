import React, { useState } from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Popconfirm,
  message,
  Select,
  Divider,
  Timeline,
  Spin,
} from "antd";
import { Edit, Trash2, DollarSign, Eye, EyeOff, Package } from "lucide-react";
import { MenuItem, MenuItemStatus, PriceHistoryResponse } from "@/types/menu";
import { menuService } from "@/services/menu.service";
import dayjs from "dayjs";

interface MenuItemDetailModalProps {
  open: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: (item: MenuItem) => void;
}

const statusConfig: Record<MenuItemStatus, { label: string; color: string }> = {
  AVAILABLE: { label: "Có sẵn", color: "success" },
  OUT_OF_STOCK: { label: "Hết hàng", color: "error" },
  HIDDEN: { label: "Ẩn", color: "default" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({
  open,
  item,
  onClose,
  onRefresh,
  onEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<MenuItemStatus | undefined>(undefined);

  React.useEffect(() => {
    if (item) setCurrentStatus(item.status);
  }, [item]);

  if (!item) return null;
  const status = statusConfig[item.status];

  const handleStatusChange = async (newStatus: MenuItemStatus) => {
    try {
      setLoading(true);
      await menuService.updateStatus(item!.id, newStatus);
      message.success("Cập nhật trạng thái thành công!");
      setCurrentStatus(newStatus);
      onRefresh();
    } catch (error: any) {
      message.error(error.message || "Lỗi cập nhật trạng thái.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await menuService.deleteItem(item.id);
      message.success("Đã xóa món ăn.");
      onClose();
      onRefresh();
    } catch (error: any) {
      message.error(error.message || "Lỗi khi xóa món ăn.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    try {
      setLoadingHistory(true);
      const res = await menuService.getPriceHistory(item.id);
      setPriceHistory(res.data);
      setShowHistory(true);
    } catch (error: any) {
      message.error("Không tải được lịch sử giá.");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={600}
    >
      {/* Image header */}
      {item.imageUrl && (
        <div className="w-full h-48 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg" style={{ width: "calc(100% + 48px)" }}>
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Title & Status */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{item.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{item.category}</p>
          </div>
          <Select
            value={currentStatus}
            onChange={handleStatusChange}
            loading={loading}
            className="w-32"
            options={[
              { value: "AVAILABLE", label: "Có sẵn" },
              { value: "OUT_OF_STOCK", label: "Hết hàng" },
              { value: "HIDDEN", label: "Ẩn" },
            ]}
          />
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">{item.description}</p>
        )}

        {/* Price info */}
        <div className="bg-zinc-50 p-4 rounded-lg">
          <div className="flex items-baseline gap-3">
            <span className="text-sm text-zinc-500">Giá gốc:</span>
            <span className="text-lg font-bold text-zinc-800">{formatPrice(item.price)}</span>
          </div>
          {item.promoPrice != null && item.promoPrice > 0 && (
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-sm text-rose-500">Giá KM:</span>
              <span className="text-lg font-bold text-rose-600">{formatPrice(item.promoPrice)}</span>
              {item.promoStart && item.promoEnd && (
                <span className="text-xs text-zinc-400">
                  ({dayjs(item.promoStart).format("DD/MM/YYYY HH:mm")} - {dayjs(item.promoEnd).format("DD/MM/YYYY HH:mm")})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags && (
          <div className="flex gap-2 flex-wrap">
            {item.tags.split(",").map((tag) => (
              <Tag key={tag.trim()} className="rounded-md">
                {tag.trim()}
              </Tag>
            ))}
          </div>
        )}

        <Divider className="my-3" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button icon={<Edit size={16} />} onClick={() => onEdit(item)}>
            Chỉnh sửa
          </Button>
          <Button onClick={handleViewHistory} loading={loadingHistory} icon={<DollarSign size={16} />}>
            {showHistory ? "Ẩn lịch sử giá" : "Lịch sử giá"}
          </Button>
          <div className="flex-1" />
          <Popconfirm
            title="Xóa món ăn này?"
            description="Món ăn sẽ bị ẩn khỏi hệ thống (xóa mềm)."
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<Trash2 size={16} />}>
              Xóa
            </Button>
          </Popconfirm>
        </div>

        {/* Price History Timeline */}
        {showHistory && priceHistory && (
          <div className="bg-zinc-50 p-4 rounded-lg mt-4 max-h-48 overflow-y-auto">
            <p className="text-sm font-semibold text-zinc-700 mb-3">Lịch sử thay đổi giá</p>
            {priceHistory.history.length > 0 ? (
              <Timeline
                items={priceHistory.history.map((h) => ({
                  children: (
                    <div className="text-sm">
                      <span className="font-medium">{formatPrice(h.price)}</span>
                      <span className="text-zinc-400 ml-2">
                        {dayjs(h.changedAt).format("DD/MM/YYYY HH:mm")}
                      </span>
                    </div>
                  ),
                }))}
              />
            ) : (
              <p className="text-sm text-zinc-400">Chưa có lịch sử thay đổi giá.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
