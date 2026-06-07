import React, { useState, useEffect } from "react";
import { Modal, Button, Tag, InputNumber, Form, message, Popconfirm } from "antd";
import { Table } from "@/types/table";
import { Users, Trash2, Edit, CheckCircle2, XCircle } from "lucide-react";
import { tableService } from "@/services/table.service";
import { useRouter } from "next/navigation";

interface TableActionModalProps {
  table: Table | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: (table: Table) => void;
}

export const TableActionModal: React.FC<TableActionModalProps> = ({
  table,
  open,
  onClose,
  onRefresh,
  onEdit,
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && table && table.status === "EMPTY") {
      form.setFieldsValue({ actualGuestCount: 2 });
    }
  }, [open, table, form]);

  if (!table) return null;

  const handleOpenTable = async (values: any) => {
    try {
      setLoading(true);
      await tableService.openTable(table.id, {
        actualGuestCount: values.actualGuestCount,
      });
      message.success(`Đã mở bàn ${table.number} thành công!`);
      form.resetFields();
      onRefresh();
      onClose();
    } catch (error: any) {
      message.error(error.message || "Không thể mở bàn.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTable = async () => {
    try {
      setLoading(true);
      await tableService.closeTable(table.id);
      message.success(`Đã đóng bàn ${table.number}.`);
      onRefresh();
      onClose();
    } catch (error: any) {
      message.error(error.message || "Không thể đóng bàn.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    try {
      setLoading(true);
      await tableService.deleteTable(table.id);
      message.success(`Đã xóa bàn ${table.number} khỏi hệ thống.`);
      onRefresh();
      onClose();
    } catch (error: any) {
      message.error(error.message || "Không thể xóa bàn.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusTag = () => {
    switch (table.status) {
      case "EMPTY":
        return <Tag color="success">Bàn trống</Tag>;
      case "SERVING":
        return <Tag color="error">Đang phục vụ</Tag>;
      case "RESERVED":
        return <Tag color="warning">Đã đặt trước</Tag>;
      case "CLEANING":
        return <Tag color="default">Chờ dọn dẹp</Tag>;
      default:
        return <Tag>{table.status}</Tag>;
    }
  };

  return (
    <Modal
      title={`Chi tiết Bàn ${table.number}`}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <div className="space-y-6 mt-4">
        {/* Thông tin cơ bản - Text mode */}
        <div className="bg-zinc-50 p-4 rounded-lg space-y-3 border border-zinc-200">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Trạng thái</span>
            {renderStatusTag()}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Hoạt động</span>
            {table.isActive ? (
              <span className="text-emerald-600 font-medium">Đang hoạt động</span>
            ) : (
              <span className="text-rose-600 font-medium">Ngưng hoạt động</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Sức chứa</span>
            <div className="flex items-center gap-1.5 font-semibold">
              <Users size={14} className="text-zinc-400" />
              {table.capacity} người
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Khu vực</span>
            <span className="font-semibold">{table.area || "Chưa có"}</span>
          </div>
        </div>

        {/* Nút Edit & Delete */}
        <div className="flex gap-3 justify-end border-b pb-4">
          <Button
            icon={<Edit size={16} />}
            onClick={() => {
              onClose();
              onEdit(table);
            }}
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xóa bàn này?"
            description="Bạn có chắc chắn muốn xóa bàn này khỏi hệ thống không?"
            onConfirm={handleDeleteTable}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<Trash2 size={16} />}>
              Xóa
            </Button>
          </Popconfirm>
        </div>

        {/* Các action dựa trên status */}
        <div className="space-y-4">
          {table.status === "EMPTY" && table.isActive && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleOpenTable}
              className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100"
            >
              <Form.Item
                name="actualGuestCount"
                label="Số lượng khách thực tế"
                rules={[{ required: true, message: "Vui lòng nhập số khách" }]}
              >
                <InputNumber min={1} max={table.capacity} className="w-full" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                loading={loading}
                icon={<CheckCircle2 size={16} />}
              >
                Mở bàn đón khách
              </Button>
            </Form>
          )}

          {table.status === "SERVING" && (
            <div className="space-y-3">
              <Button
                type="primary"
                className="w-full h-10"
                onClick={() => {
                  router.push(`/admin/orders?tableId=${table.id}`);
                }}
              >
                Xem chi tiết Đơn hàng
              </Button>
              <Popconfirm
                title="Đóng bàn?"
                description="Bạn có chắc chắn muốn đóng bàn này và chuyển sang dọn dẹp?"
                onConfirm={handleCloseTable}
                okText="Đóng bàn"
                cancelText="Hủy"
              >
                <Button
                  danger
                  className="w-full h-10"
                  loading={loading}
                  icon={<XCircle size={16} />}
                >
                  Kết thúc phục vụ (Đóng bàn)
                </Button>
              </Popconfirm>
            </div>
          )}

          {table.status === "CLEANING" && (
            <Popconfirm
              title="Dọn dẹp xong?"
              description="Bàn đã sẵn sàng đón khách mới?"
              onConfirm={handleCloseTable}
              okText="Đã xong"
              cancelText="Chưa"
            >
              <Button
                type="primary"
                className="w-full h-10 bg-slate-700 hover:bg-slate-800"
                loading={loading}
              >
                Hoàn tất dọn dẹp
              </Button>
            </Popconfirm>
          )}

          {table.status === "RESERVED" && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-sm">
                Bàn này đang có lịch đặt trước. Vui lòng kiểm tra màn hình Đặt bàn để xem chi tiết.
              </div>
              <Button
                className="w-full h-10"
                onClick={() => router.push(`/admin/reservations`)}
              >
                Đến trang Đặt bàn
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
