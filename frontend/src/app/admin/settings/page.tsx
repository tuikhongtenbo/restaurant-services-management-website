"use client";

import { useState } from "react";
import { User, Building2, Shield, Bell } from "lucide-react";
import { Tabs, Form, Input, Switch, Button, Upload, Avatar, message } from "antd";
import type { UploadProps } from "antd";

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500 mt-0.5">{desc}</p>
    </div>
  );
}

export default function SettingsPage() {
  const [formProfile] = Form.useForm();
  const [formRestaurant] = Form.useForm();
  const [formSecurity] = Form.useForm();

  const handleSave = () => {
    message.success("Đã lưu thay đổi thành công!");
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
    headers: { authorization: 'authorization-text' },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} tải lên thành công`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
  };

  const tabItems = [
    {
      key: "profile",
      label: <span className="flex items-center gap-2"><User size={14} /> Hồ sơ</span>,
      children: (
        <div className="max-w-2xl mt-4">
          <SectionTitle title="Hồ sơ cá nhân" desc="Cập nhật thông tin cá nhân của bạn" />
          
          <div className="flex items-center gap-4 mb-8">
            <Avatar size={64} style={{ backgroundColor: '#2563EB', fontSize: 24 }}>A</Avatar>
            <div>
              <Upload {...uploadProps} showUploadList={false}>
                <Button type="link" className="px-0 font-medium">Đổi ảnh đại diện</Button>
              </Upload>
              <p className="text-xs text-zinc-400">JPG, PNG tối đa 2MB</p>
            </div>
          </div>

          <Form form={formProfile} layout="vertical" initialValues={{ name: "Admin User", email: "admin@restaurant.com", phone: "0901234567", role: "Quản trị viên" }}>
            <Form.Item label="Họ và tên" name="name" rules={[{ required: true }]}>
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Chức vụ" name="role">
              <Input size="large" disabled />
            </Form.Item>
            <Form.Item>
              <Button type="primary" size="large" onClick={handleSave}>Lưu thay đổi</Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: "restaurant",
      label: <span className="flex items-center gap-2"><Building2 size={14} /> Nhà hàng</span>,
      children: (
        <div className="max-w-2xl mt-4">
          <SectionTitle title="Thông tin nhà hàng" desc="Cập nhật thông tin hiển thị của nhà hàng" />
          <Form form={formRestaurant} layout="vertical" initialValues={{ name: "Restaurant Management", address: "123 Nguyễn Huệ, Q1, TP.HCM", phone: "028 1234 5678", email: "contact@restaurant.com", hours: "06:00 - 22:00" }}>
            <Form.Item label="Tên nhà hàng" name="name" rules={[{ required: true }]}>
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Địa chỉ" name="address">
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Email liên hệ" name="email">
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Giờ mở cửa" name="hours">
              <Input size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" size="large" onClick={handleSave}>Lưu thay đổi</Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: "security",
      label: <span className="flex items-center gap-2"><Shield size={14} /> Bảo mật</span>,
      children: (
        <div className="max-w-2xl mt-4">
          <SectionTitle title="Bảo mật" desc="Quản lý mật khẩu và bảo mật tài khoản" />
          <Form form={formSecurity} layout="vertical">
            <Form.Item label="Mật khẩu hiện tại" name="current" rules={[{ required: true }]}>
              <Input.Password size="large" />
            </Form.Item>
            <Form.Item label="Mật khẩu mới" name="new" rules={[{ required: true }]}>
              <Input.Password size="large" />
            </Form.Item>
            <Form.Item label="Xác nhận mật khẩu" name="confirm" rules={[{ required: true }]}>
              <Input.Password size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" size="large" onClick={handleSave}>Cập nhật mật khẩu</Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: "notifications",
      label: <span className="flex items-center gap-2"><Bell size={14} /> Thông báo</span>,
      children: (
        <div className="max-w-2xl mt-4">
          <SectionTitle title="Tùy chỉnh thông báo" desc="Lựa chọn các sự kiện bạn muốn nhận thông báo" />
          
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Đơn hàng & Thanh toán</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm text-zinc-700">Đơn hàng mới</span> <Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><span className="text-sm text-zinc-700">Đơn hàng bị hủy</span> <Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><span className="text-sm text-zinc-700">Đơn hàng hoàn thành</span> <Switch /></div>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Hệ thống & Đặt bàn</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm text-zinc-700">Nhân viên xin nghỉ phép</span> <Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><span className="text-sm text-zinc-700">Cập nhật hệ thống</span> <Switch /></div>
                <div className="flex items-center justify-between"><span className="text-sm text-zinc-700">Đặt bàn mới</span> <Switch defaultChecked /></div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="primary" size="large" onClick={handleSave}>Lưu cài đặt</Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-2 min-h-[calc(100vh-112px)]">
      <Tabs
        tabPosition="left"
        items={tabItems}
        className="h-full"
        style={{ height: 'calc(100vh - 128px)' }}
      />
    </div>
  );
}
