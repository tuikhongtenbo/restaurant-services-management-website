import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, message, Divider, Space, Button } from "antd";
import { Plus } from "lucide-react";
import { Table, CreateTableRequest, UpdateTableRequest } from "@/types/table";
import { tableService } from "@/services/table.service";

interface TableFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialData?: Table;
  existingAreas: string[];
}

export const TableFormModal: React.FC<TableFormModalProps> = ({
  open,
  onCancel,
  onSuccess,
  initialData,
  existingAreas,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue({
          number: initialData.number,
          capacity: initialData.capacity,
          area: initialData.area,
          isActive: initialData.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ capacity: 4, isActive: true });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      if (initialData) {
        const updateData: UpdateTableRequest = {
          number: values.number,
          capacity: values.capacity,
          area: values.area,
        };
        await tableService.updateTable(initialData.id, updateData);
        // Lưu ý: Nếu cần update isActive thì backend UpdateTableRequest chưa có field này.
        // Có thể backend dùng API khác để toggle active hoặc nó nằm trong logic khác.
        // Chúng ta tạm thời focus vào update các trường cơ bản.
        message.success("Cập nhật bàn thành công!");
      } else {
        const createData: CreateTableRequest = {
          number: values.number,
          capacity: values.capacity,
          area: values.area,
        };
        await tableService.createTable(createData);
        message.success("Thêm bàn mới thành công!");
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.message || "Đã xảy ra lỗi khi lưu thông tin bàn.");
    } finally {
      setSubmitting(false);
    }
  };

  const [items, setItems] = useState<string[]>(existingAreas);
  const [customArea, setCustomArea] = useState('');

  useEffect(() => {
    setItems(existingAreas);
  }, [existingAreas]);

  const onAreaNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomArea(event.target.value);
  };

  const addItem = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    if (!customArea || items.includes(customArea)) return;
    setItems([...items, customArea]);
    form.setFieldsValue({ area: customArea });
    setCustomArea('');
  };

  const areaOptions = items
    .filter(a => a)
    .map((area) => ({ value: area, label: area }));

  return (
    <Modal
      title={initialData ? "Chỉnh sửa bàn" : "Thêm bàn mới"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="number"
            label="Số bàn"
            rules={[
              { required: true, message: "Vui lòng nhập số bàn" },
              { max: 10, message: "Số bàn không quá 10 ký tự" }
            ]}
          >
            <Input placeholder="VD: B01, VIP-1" />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Sức chứa (người)"
            rules={[{ required: true, message: "Vui lòng nhập sức chứa" }]}
          >
            <InputNumber min={1} max={50} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item
          name="area"
          label="Khu vực"
          rules={[{ required: true, message: "Vui lòng chọn hoặc nhập khu vực" }]}
          tooltip="Gõ tên khu vực mới nếu chưa có trong danh sách."
        >
          <Select
            options={areaOptions}
            placeholder="Chọn khu vực..."
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ padding: '0 8px 4px' }}>
                  <Input
                    placeholder="Thêm khu vực mới"
                    value={customArea}
                    onChange={onAreaNameChange}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <Button type="text" icon={<Plus size={16} />} onClick={addItem}>
                    Thêm
                  </Button>
                </Space>
              </>
            )}
          />
        </Form.Item>

        {initialData && (
          <Form.Item
            name="isActive"
            label="Đang hoạt động"
            valuePropName="checked"
            tooltip="Bàn ngưng hoạt động sẽ không thể nhận khách hoặc mở đơn mới."
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
