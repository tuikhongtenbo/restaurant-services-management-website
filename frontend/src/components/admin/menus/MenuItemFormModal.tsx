import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  AutoComplete,
  message,
  Divider,
  Space,
} from "antd";
import { Plus } from "lucide-react";
import { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest, MenuItemStatus } from "@/types/menu";
import dayjs from "dayjs";

interface MenuItemFormModalProps {
  open: boolean;
  initialData?: MenuItem;
  existingCategories: string[];
  onCancel: () => void;
  onSuccess: () => void;
}

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  open,
  initialData,
  existingCategories,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      form.setFieldsValue({
        name: initialData.name,
        category: initialData.category,
        description: initialData.description,
        imageUrl: initialData.imageUrl,
        price: initialData.price,
        status: initialData.status,
        tags: initialData.tags,
        sortOrder: initialData.sortOrder,
        promoPrice: initialData.promoPrice,
        promoRange:
          initialData.promoStart && initialData.promoEnd
            ? [dayjs(initialData.promoStart), dayjs(initialData.promoEnd)]
            : undefined,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ status: "AVAILABLE", sortOrder: 0 });
    }
  }, [open, initialData, form]);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      const { menuService } = await import("@/services/menu.service");

      const promoStart = values.promoRange?.[0] ? dayjs(values.promoRange[0]).format("YYYY-MM-DDTHH:mm:ss") : undefined;
      const promoEnd = values.promoRange?.[1] ? dayjs(values.promoRange[1]).format("YYYY-MM-DDTHH:mm:ss") : undefined;

      if (initialData) {
        const payload: UpdateMenuItemRequest = {
          name: values.name,
          category: values.category,
          description: values.description,
          imageUrl: values.imageUrl,
          price: values.price,
          status: values.status,
          tags: values.tags,
          sortOrder: values.sortOrder,
          promoPrice: values.promoPrice || undefined,
          promoStart: promoStart || undefined,
          promoEnd: promoEnd || undefined,
        };
        await menuService.updateItem(initialData.id, payload);
        message.success("Cập nhật món ăn thành công!");
      } else {
        const payload: CreateMenuItemRequest = {
          name: values.name,
          category: values.category,
          description: values.description,
          imageUrl: values.imageUrl,
          price: values.price,
          tags: values.tags,
          sortOrder: values.sortOrder,
          promoPrice: values.promoPrice || undefined,
          promoStart: promoStart || undefined,
          promoEnd: promoEnd || undefined,
        };
        await menuService.createItem(payload);
        message.success("Thêm món ăn mới thành công!");
      }
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  const [items, setItems] = useState<string[]>(existingCategories);
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    setItems(existingCategories);
  }, [existingCategories]);

  const onCategoryNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomCategory(event.target.value);
  };

  const addItem = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    if (!customCategory || items.includes(customCategory)) return;
    setItems([...items, customCategory]);
    form.setFieldsValue({ category: customCategory });
    setCustomCategory('');
  };

  const categoryOptions = items
    .filter((c) => c) // remove null/undefined
    .map((c) => ({ value: c, label: c }));

  return (
    <Modal
      title={initialData ? "Chỉnh sửa Món ăn" : "Thêm Món ăn mới"}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={640}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Tên món"
            rules={[{ required: true, message: "Nhập tên món" }]}
          >
            <Input placeholder="Phở bò Kobe" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Chọn hoặc nhập danh mục" }]}
          >
            <Select
              options={categoryOptions}
              placeholder="Chọn danh mục..."
              popupRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 4px' }}>
                    <Input
                      placeholder="Thêm danh mục mới"
                      value={customCategory}
                      onChange={onCategoryNameChange}
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
        </div>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} placeholder="Mô tả ngắn gọn về món ăn" />
        </Form.Item>

        <Form.Item
          name="imageUrl"
          label="URL Hình ảnh"
          rules={[{ required: true, message: "Nhập đường dẫn hình ảnh" }]}
        >
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[{ required: true, message: "Nhập giá" }]}
          >
            <InputNumber
              min={0}
              step={1000}
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => Number(value!.replace(/,/g, "")) as any}
            />
          </Form.Item>

          {initialData && (
            <Form.Item name="status" label="Trạng thái">
              <Select
                options={[
                  { value: "AVAILABLE", label: "Có sẵn" },
                  { value: "OUT_OF_STOCK", label: "Hết hàng" },
                  { value: "HIDDEN", label: "Ẩn" },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item name="sortOrder" label="Thứ tự">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item name="tags" label="Tags (phân cách bởi dấu phẩy)">
          <Input placeholder="best-seller, new, spicy" />
        </Form.Item>

        {/* Promo section */}
        <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-100 mb-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">Khuyến mãi (tùy chọn)</p>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="promoPrice" 
              label="Giá khuyến mãi (VNĐ)" 
              dependencies={['price', 'promoRange']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const price = getFieldValue('price');
                    const range = getFieldValue('promoRange');
                    if (value && price && value >= price) {
                      return Promise.reject(new Error("Giá KM phải nhỏ hơn giá gốc"));
                    }
                    if (range && range.length > 0 && (!value || value <= 0)) {
                      return Promise.reject(new Error("Vui lòng nhập giá KM"));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                min={0}
                step={1000}
                className="w-full"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => Number(value!.replace(/,/g, "")) as any}
              />
            </Form.Item>

            <Form.Item 
              name="promoRange" 
              label="Thời gian áp dụng"
              dependencies={['promoPrice']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const promoPrice = getFieldValue('promoPrice');
                    if (promoPrice && promoPrice > 0 && (!value || value.length < 2)) {
                      return Promise.reject(new Error("Cần chọn thời gian áp dụng"));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
            </Form.Item>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialData ? "Cập nhật" : "Thêm món"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
