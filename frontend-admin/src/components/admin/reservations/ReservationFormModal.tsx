import React, { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, Button, DatePicker, message, Spin, Select } from "antd";
import { reservationService } from "@/services/reservation.service";
import { Reservation, CreateReservationRequest, UpdateReservationRequest } from "@/types/reservation";
import dayjs from "dayjs";
import { Clock } from "lucide-react";

interface ReservationFormModalProps {
  open: boolean;
  initialData?: Reservation;
  onCancel: () => void;
  onSuccess: () => void;
  staffId?: string;
}

export const ReservationFormModal: React.FC<ReservationFormModalProps> = ({
  open,
  initialData,
  onCancel,
  onSuccess,
  staffId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Watch for changes to date and partySize to fetch slots
  const dateValue = Form.useWatch("date", form);
  const partySizeValue = Form.useWatch("partySize", form);

  useEffect(() => {
    if (open) {
      if (initialData) {
        const reservedAt = dayjs(initialData.reservedAt);
        form.setFieldsValue({
          customerName: initialData.customerName,
          customerPhone: initialData.customerPhone,
          partySize: initialData.partySize,
          note: initialData.note,
          date: reservedAt,
          time: reservedAt.format("HH:mm:ss"), // Extract time
        });
        // We still fetch available slots in case they want to change the time
        fetchSlots(reservedAt.format("YYYY-MM-DD"), initialData.partySize);
      } else {
        form.setFieldsValue({ partySize: 2 });
      }
    } else {
      setAvailableSlots([]);
      form.resetFields();
    }
  }, [open, initialData, form]);

  useEffect(() => {
    if (open && dateValue && partySizeValue) {
      const dateStr = dateValue.format("YYYY-MM-DD");
      fetchSlots(dateStr, partySizeValue);
    }
  }, [dateValue, partySizeValue, open]);

  const fetchSlots = async (dateStr: string, size: number) => {
    try {
      setFetchingSlots(true);
      const slots = await reservationService.getAvailableSlots(dateStr, size);
      
      // If editing, make sure the current time is in the slots to avoid invalid selection
      if (initialData && initialData.partySize === size && dayjs(initialData.reservedAt).format("YYYY-MM-DD") === dateStr) {
        const currentTime = dayjs(initialData.reservedAt).format("HH:mm:ss");
        // Spring LocalTime format might omit seconds if 00, so we check carefully
        const currentPrefix = currentTime.substring(0, 5);
        if (!slots.some(s => s.startsWith(currentPrefix))) {
           slots.push(currentTime);
        }
      }
      
      setAvailableSlots(slots.sort());
      
      // Auto clear time if previously selected time is no longer available
      const currentTime = form.getFieldValue("time");
      if (currentTime && !slots.some(s => s.startsWith(currentTime.substring(0,5))) && !initialData) {
         form.setFieldValue("time", undefined);
      }
    } catch (error) {
      console.error("Lỗi khi tải giờ trống:", error);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      // Combine date and time
      const dateStr = values.date.format("YYYY-MM-DD");
      const timeStr = values.time; // Format HH:mm:ss from API
      // Construct OffsetDateTime equivalent with +07:00
      const reservedAtStr = `${dateStr}T${timeStr}+07:00`;

      if (initialData) {
        const payload: UpdateReservationRequest = {
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          partySize: values.partySize,
          reservedAt: reservedAtStr,
          note: values.note,
        };
        await reservationService.updateReservation(initialData.id, payload);
        message.success("Cập nhật thông tin đặt bàn thành công!");
      } else {
        const payload: CreateReservationRequest = {
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          partySize: values.partySize,
          reservedAt: reservedAtStr,
          note: values.note,
        };
        await reservationService.createReservation(payload, staffId);
        message.success("Tạo đặt bàn mới thành công!");
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
      title={initialData ? "Chỉnh sửa Đặt bàn" : "Tạo Đặt bàn mới"}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="customerName"
            label="Tên khách hàng"
            rules={[
              { required: true, message: "Vui lòng nhập tên" },
              { max: 100, message: "Tên không được vượt quá 100 ký tự" }
            ]}
          >
            <Input placeholder="Nguyễn Văn A" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="customerPhone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{10,11}$/, message: "SĐT không hợp lệ" }
            ]}
          >
            <Input placeholder="0987654321" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="partySize"
            label="Số khách"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} max={50} className="w-full" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Ngày đến"
            rules={[{ required: true, message: "Chọn ngày" }]}
          >
            <DatePicker 
              className="w-full" 
              format="DD/MM/YYYY" 
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="time"
            label="Giờ đến"
            rules={[{ required: true, message: "Chọn giờ" }]}
          >
            <Select 
              placeholder="Chọn giờ"
              loading={fetchingSlots}
              disabled={!dateValue || !partySizeValue || fetchingSlots}
              suffixIcon={<Clock size={16} />}
              options={availableSlots.map(slot => ({
                label: slot.substring(0, 5), // Show HH:mm
                value: slot,                 // Keep original format for submitting
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Yêu cầu đặc biệt (dị ứng, ghế trẻ em...)" />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialData ? "Cập nhật" : "Tạo Đặt bàn"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
