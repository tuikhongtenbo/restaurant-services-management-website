import React, { useState, useEffect } from "react";
import { Modal, Form, Input, message } from "antd";
import { User, RegisterRequest, RoleResponse } from "@/types/user";
import { userService } from "@/services/user.service";

interface EditProfileModalProps {
  open: boolean;
  user: User | null;
  roles: RoleResponse[];
  onCancel: () => void;
  onSuccess: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  user,
  roles,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, user, form]);

  const handleFinish = async (values: any) => {
    if (!user) return;
    try {
      setLoading(true);

      // Find the UUID of the user's primary role
      const userRoleName = user.roles[0];
      const foundRole = roles.find((r) => r.name === userRoleName);
      const roleId = foundRole ? foundRole.id : userRoleName;

      const payload: RegisterRequest = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        password: "123456", // Dummy password to bypass backend validation
        roleIds: [roleId],
      };

      await userService.updateUser(user.id, payload);
      message.success("Cập nhật thông tin cá nhân thành công!");
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error.message && error.message.includes("Email is already in use")) {
        form.setFields([{ name: "email", errors: ["Email này đã được sử dụng!"] }]);
      } else {
        message.error(error.message || "Đã xảy ra lỗi khi cập nhật.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa thông tin cá nhân"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="email@restaurant.com" />
        </Form.Item>

        <Form.Item name="phone" label="Số điện thoại">
          <Input placeholder="0901234567" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
