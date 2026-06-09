"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber } from "antd";
import { Customer } from "@/types/customer";

interface AdjustPointsModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: { points: number; note: string }) => Promise<void>;
  customer: Customer | null;
  loading: boolean;
}

export const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  open,
  onCancel,
  onSubmit,
  customer,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title={`Điều chỉnh điểm: ${customer?.fullName}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={500}
      destroyOnClose
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-800 border border-blue-100">
        <p className="mb-1 font-medium">Điểm hiện tại: <strong className="text-lg">{customer?.currentPoints || 0}</strong></p>
        <p className="text-xs text-blue-600 mb-0">Nhập số âm (VD: -50) để trừ điểm, số dương (VD: 100) để cộng điểm.</p>
      </div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="points"
          label="Số điểm thay đổi"
          rules={[
            { required: true, message: "Vui lòng nhập số điểm" },
            { type: "number", message: "Số điểm không hợp lệ" }
          ]}
        >
          <InputNumber
            className="w-full"
            placeholder="VD: 100 hoặc -50"
          />
        </Form.Item>
        <Form.Item
          name="note"
          label="Lý do điều chỉnh"
          rules={[
            { required: true, message: "Vui lòng nhập lý do" },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Ghi chú nguyên nhân (VD: Tặng điểm sinh nhật KH)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
