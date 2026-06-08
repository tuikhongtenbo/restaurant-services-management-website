"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, Row, Col } from "antd";
import dayjs from "dayjs";
import { Voucher, VoucherDiscountType, CustomerTier } from "@/types/voucher";

interface VoucherFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  initialValues: Voucher | null;
  loading: boolean;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading,
}) => {
  const [form] = Form.useForm();
  const discountType = Form.useWatch("discountType", form);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          dateRange: [
            initialValues.validFrom ? dayjs(initialValues.validFrom) : undefined,
            initialValues.validUntil ? dayjs(initialValues.validUntil) : undefined,
          ],
        });
      } else {
        form.resetFields();
        // Set defaults for new voucher
        form.setFieldsValue({
          discountType: "PERCENT" as VoucherDiscountType,
          minTier: "MEMBER" as CustomerTier,
          isActive: true,
        });
      }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Transform dateRange to validFrom and validUntil
      const payload = { ...values };
      if (values.dateRange && values.dateRange.length === 2) {
        payload.validFrom = values.dateRange[0]?.toISOString();
        payload.validUntil = values.dateRange[1]?.toISOString();
      }
      delete payload.dateRange;

      await onSubmit(payload);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const isPercent = discountType === "PERCENT";

  return (
    <Modal
      title={initialValues ? "Cập nhật Khuyến mãi" : "Thêm Khuyến mãi mới"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      destroyOnClose
      okText={initialValues ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Mã Voucher"
              rules={[
                { required: true, message: "Vui lòng nhập mã voucher" },
                { pattern: /^[A-Z0-9]+$/, message: "Mã chỉ chứa chữ in hoa và số, không khoảng trắng" }
              ]}
              normalize={(value) => (value || "").toUpperCase().replace(/\s/g, "")}
            >
              <Input 
                placeholder="VD: SUMMER2026" 
                disabled={!!initialValues} // Disable editing code after creation
                maxLength={20}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="description"
              label="Mô tả ngắn"
            >
              <Input placeholder="VD: Giảm 20% cho đơn từ 500k" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="discountType"
              label="Loại giảm giá"
              rules={[{ required: true, message: "Vui lòng chọn loại giảm giá" }]}
            >
              <Select>
                <Select.Option value="PERCENT">Theo phần trăm (%)</Select.Option>
                <Select.Option value="FIXED">Số tiền cố định (VNĐ)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="discountValue"
              label="Mức giảm giá"
              rules={[
                { required: true, message: "Vui lòng nhập mức giảm" },
                { 
                  validator: async (_, value) => {
                    if (value === undefined || value === null) return;
                    if (value <= 0) throw new Error("Mức giảm phải lớn hơn 0");
                    if (isPercent && value > 100) throw new Error("Phần trăm không được vượt quá 100%");
                  }
                }
              ]}
            >
              <InputNumber
                className="w-full"
                min={1}
                max={isPercent ? 100 : undefined}
                formatter={(value) => isPercent ? `${value}%` : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value!.replace(/%|\s?|(,*)/g, "") as any}
                addonAfter={isPercent ? "%" : "VNĐ"}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="minOrderValue"
              label="Giá trị đơn tối thiểu (VNĐ)"
              rules={[{ type: "number", min: 0, message: "Giá trị không hợp lệ" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                step={10000}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value!.replace(/\s?|(,*)/g, "") as any}
                placeholder="VD: 500,000"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="minTier"
              label="Hạng khách hàng áp dụng"
              rules={[{ required: true, message: "Vui lòng chọn hạng" }]}
            >
              <Select>
                <Select.Option value="MEMBER">Tất cả khách hàng (Member)</Select.Option>
                <Select.Option value="BRONZE">Từ hạng Đồng (Bronze) trở lên</Select.Option>
                <Select.Option value="SILVER">Từ hạng Bạc (Silver) trở lên</Select.Option>
                <Select.Option value="GOLD">Chỉ hạng Vàng (Gold)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="usageLimit"
              label="Giới hạn số lượt dùng"
              rules={[{ type: "number", min: 1, message: "Số lượt phải lớn hơn 0" }]}
            >
              <InputNumber
                className="w-full"
                min={1}
                placeholder="Để trống nếu không giới hạn"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="minPoints"
              label="Điểm tối thiểu yêu cầu"
              rules={[{ type: "number", min: 0, message: "Điểm không hợp lệ" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder="Để trống nếu không yêu cầu điểm"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="dateRange"
              label="Thời hạn sử dụng"
            >
              <DatePicker.RangePicker 
                showTime 
                className="w-full"
                format="DD/MM/YYYY HH:mm"
                placeholder={["Bắt đầu", "Kết thúc"]}
              />
            </Form.Item>
          </Col>
          {initialValues && (
            <Col span={8}>
              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};
