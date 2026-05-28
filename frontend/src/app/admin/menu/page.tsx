"use client";

import { useState } from "react";
import { Search, Plus, Star, AlertCircle } from "lucide-react";
import { Input, Button, Segmented, Modal, Form, Select, InputNumber, Switch, message } from "antd";
import { mockMenuItems, formatCurrency, MenuItem } from "@/data/mock";

const categories = ["Tất cả", "Khai vị", "Món chính", "Tráng miệng", "Đồ uống"];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const filtered = mockMenuItems.filter((item) => {
    const matchCat = activeCategory === "Tất cả" || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = () => {
    form.validateFields().then((values) => {
      console.log("Add item:", values);
      message.success("Thêm món ăn thành công!");
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          prefix={<Search size={15} className="text-zinc-400" />}
          placeholder="Tìm món ăn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
          allowClear
        />
        <Segmented
          options={categories}
          value={activeCategory}
          onChange={(val) => setActiveCategory(val as string)}
          className="p-1 h-9 flex items-center"
        />
        <Button
          type="primary"
          icon={<Plus size={15} />}
          className="ml-auto h-9"
          onClick={() => setIsModalOpen(true)}
        >
          Thêm món
        </Button>
      </div>

      {/* Summary */}
      <p className="text-xs text-zinc-500">{filtered.length} món · {mockMenuItems.filter((m) => !m.isAvailable).length} tạm ngừng</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Search size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Không tìm thấy món nào</p>
        </div>
      )}

      {/* Modal Thêm Món */}
      <Modal
        title="Thêm món ăn mới"
        open={isModalOpen}
        onOk={handleAdd}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        okText="Lưu món ăn"
        cancelText="Hủy"
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Tên món ăn" rules={[{ required: true, message: 'Vui lòng nhập tên món' }]}>
            <Input placeholder="Vd: Bò lúc lắc" size="large" />
          </Form.Item>
          
          <div className="flex gap-4">
            <Form.Item name="category" label="Danh mục" rules={[{ required: true }]} className="flex-1">
              <Select size="large" options={categories.filter(c => c !== "Tất cả").map(c => ({ label: c, value: c }))} />
            </Form.Item>
            <Form.Item name="price" label="Giá bán (VNĐ)" rules={[{ required: true }]} className="flex-1">
              <InputNumber
                size="large"
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
              />
            </Form.Item>
          </div>

          <Form.Item name="image" label="URL Hình ảnh">
            <Input placeholder="https://..." size="large" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về món ăn..." />
          </Form.Item>

          <div className="flex gap-6 mt-2">
            <Form.Item name="isAvailable" label="Trạng thái mở bán" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            <Form.Item name="isPopular" label="Đánh dấu bán chạy" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group ${!item.isAvailable ? "opacity-60" : "border-zinc-100"}`}>
      {/* Image */}
      <div className="relative h-40 bg-zinc-100 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {item.isPopular && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            <Star size={9} fill="white" /> Bán chạy
          </span>
        )}
        {!item.isAvailable && (
          <span className="absolute top-2 right-2 flex items-center gap-1 bg-zinc-800/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
            <AlertCircle size={9} /> Hết
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-3.5">
        <p className="text-xs text-zinc-400 mb-0.5">{item.category}</p>
        <h3 className="text-sm font-semibold text-zinc-900 truncate">{item.name}</h3>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{item.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-bold text-blue-600">{formatCurrency(item.price)}</span>
          <span className="text-[11px] text-zinc-400">{item.soldCount} đã bán</span>
        </div>
        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button size="small" className="flex-1 text-xs h-7">Sửa</Button>
          <Button size="small" danger={item.isAvailable} className="flex-1 text-xs h-7">
            {item.isAvailable ? "Ẩn" : "Hiện"}
          </Button>
        </div>
      </div>
    </div>
  );
}
