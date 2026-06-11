import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { reservationService } from "@/services/reservation.service";
import { Reservation } from "@/types/reservation";

interface ReservationCancelModalProps {
  open: boolean;
  reservation: Reservation | null;
  onCancel: () => void;
  onSuccess: () => void;
  staffId?: string;
}

export const ReservationCancelModal: React.FC<ReservationCancelModalProps> = ({
  open,
  reservation,
  onCancel,
  onSuccess,
  staffId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { reason: string }) => {
    if (!reservation) return;
    try {
      setLoading(true);
      await reservationService.cancelReservation(reservation.id, { reason: values.reason }, staffId);
      message.success("Đã hủy đặt bàn thành công.");
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || "Không thể hủy đặt bàn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Hủy đơn đặt bàn"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      destroyOnHidden
    >
      <div className="mb-4 text-zinc-600">
        Bạn đang hủy đơn đặt bàn của khách hàng <strong className="text-zinc-900">{reservation?.customerName}</strong>. Vui lòng nhập lý do hủy.
      </div>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="reason"
          label="Lý do hủy"
          rules={[{ required: true, message: "Vui lòng nhập lý do hủy đặt bàn" }]}
        >
          <Input.TextArea rows={3} placeholder="Ví dụ: Khách gọi điện báo bận..." />
        </Form.Item>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onCancel} disabled={loading}>
            Thoát
          </Button>
          <Button type="primary" danger htmlType="submit" loading={loading}>
            Xác nhận Hủy
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
