import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, message, Row, Col } from "antd";
import { voucherService } from "@/services/voucher.service";
import { Voucher, VoucherDiscountType, CustomerTier } from "@/types/voucher";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface VoucherFormModalProps {
  open: boolean;
  initialData?: Voucher;
  onCancel: () => void;
  onSuccess: () => void;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  open,
  initialData,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          dateRange: [
            initialData.validFrom ? dayjs(initialData.validFrom) : undefined,
            initialData.validUntil ? dayjs(initialData.validUntil) : undefined,
          ],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          discountType: "FIXED",
          minTier: "MEMBER",
        });
      }
    }
  }, [open, initialData, form]);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);

      const payload = {
        code: values.code.toUpperCase(),
        description: values.description,
        discountType: values.discountType,
        discountValue: values.discountValue,
        minOrderValue: values.minOrderValue,
        minTier: values.minTier,
        minPoints: values.minPoints,
        validFrom: values.dateRange?.[0]?.toISOString() || undefined,
        validUntil: values.dateRange?.[1]?.toISOString() || undefined,
        usageLimit: values.usageLimit,
      };

      if (isEdit) {
        await voucherService.updateVoucher(initialData!.id, payload);
        message.success("Cập nhật khuyến mãi thành công!");
      } else {
        await voucherService.createVoucher(payload);
        message.success("Tạo khuyến mãi mới thành công!");
      }

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Cập nhật Khuyến mãi" : "Tạo Khuyến mãi mới"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={isEdit ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Mã Voucher"
              rules={[
                { required: true, message: "Vui lòng nhập mã Voucher" },
                { pattern: /^[A-Za-z0-9_]+$/, message: "Mã không được chứa ký tự đặc biệt hoặc khoảng trắng" }
              ]}
              normalize={(value) => value?.toUpperCase()}
            >
              <Input placeholder="VD: SUMMER2024" disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="discountType"
              label="Loại giảm giá"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="FIXED">Giảm tiền mặt (VNĐ)</Select.Option>
                <Select.Option value="PERCENT">Giảm phần trăm (%)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}
            >
              {({ getFieldValue }) => {
                const isPercent = getFieldValue('discountType') === 'PERCENT';
                return (
                  <Form.Item
                    name="discountValue"
                    label={isPercent ? "Mức giảm (%)" : "Số tiền giảm (VNĐ)"}
                    rules={[{ required: true, message: "Vui lòng nhập mức giảm" }]}
                  >
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={isPercent ? 100 : undefined}
                      formatter={value => isPercent ? `${value}` : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="minOrderValue"
              label="Đơn hàng tối thiểu (VNĐ)"
            >
              <InputNumber
                className="w-full"
                min={0}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="minTier"
              label="Hạng khách hàng áp dụng"
            >
              <Select>
                <Select.Option value="MEMBER">Thành viên (Member)</Select.Option>
                <Select.Option value="BRONZE">Đồng (Bronze)</Select.Option>
                <Select.Option value="SILVER">Bạc (Silver)</Select.Option>
                <Select.Option value="GOLD">Vàng (Gold)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="minPoints"
              label="Điểm tích lũy tối thiểu"
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dateRange"
              label="Thời gian áp dụng"
            >
              <RangePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="usageLimit"
              label="Giới hạn số lượt dùng"
              tooltip="Để trống nếu không giới hạn"
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Mô tả chi tiết">
          <TextArea rows={3} placeholder="Điều kiện áp dụng, đối tượng khách hàng..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
