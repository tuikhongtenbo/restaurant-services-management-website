"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Row, Col } from "antd";
import { Customer } from "@/types/customer";

interface CustomerFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  initialValues: Customer | null;
  loading: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

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
      title={initialValues ? "Cập nhật Khách hàng" : "Thêm Khách hàng mới"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
      okText={initialValues ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="fullName"
              label="Họ và Tên"
              rules={[
                { required: true, message: "Vui lòng nhập họ tên" },
              ]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
                { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: "Số điện thoại không hợp lệ" }
              ]}
            >
              <Input placeholder="0901234567" disabled={!!initialValues} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { type: "email", message: "Email không hợp lệ" }
              ]}
            >
              <Input placeholder="nguyenvana@gmail.com" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
