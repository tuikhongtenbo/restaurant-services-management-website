import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, message } from "antd";
import { User, RegisterRequest, RoleResponse } from "@/types/user";
import { userService } from "@/services/user.service";

interface UserFormModalProps {
  open: boolean;
  initialData?: User;
  roles: RoleResponse[];
  onCancel: () => void;
  onSuccess: () => void;
  currentUserRole?: string;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  initialData,
  roles,
  onCancel,
  onSuccess,
  currentUserRole,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  useEffect(() => {
    if (open && initialData) {
      form.setFieldsValue({
        fullName: initialData.fullName,
        email: initialData.email,
        phone: initialData.phone,
        roleIds: initialData.roles[0], // Chọn role đầu tiên vì giờ chỉ 1 role
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, initialData, form]);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);

      // Xử lý giá trị roleIds (giờ là string vì select 1)
      const selectedRoleName = values.roleIds;
      const found = roles.find((r) => r.name === selectedRoleName);
      const selectedRoleId = found ? found.id : selectedRoleName;

      const payload: RegisterRequest = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password || "123456", // mật khẩu mặc định khi tạo mới
        roleIds: [selectedRoleId], // Backend vẫn mong đợi mảng
      };

      if (isEdit) {
        await userService.updateUser(initialData!.id, payload);
        message.success("Cập nhật nhân viên thành công!");
      } else {
        await userService.createUser(payload);
        message.success("Thêm nhân viên mới thành công!");
      }

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error.message && error.message.includes("Email is already in use")) {
        form.setFields([{ name: "email", errors: ["Email này đã được sử dụng!"] }]);
      } else {
        message.error(error.message || "Đã xảy ra lỗi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdminEdit = isEdit && initialData?.roles.includes("ADMIN");

  const roleOptions = roles
    .filter((r) => {
      if (currentUserRole === "MANAGER") {
        return r.name === "STAFF"; // Manager chỉ được chọn STAFF
      }
      return r.name !== "ADMIN" || isAdminEdit; // ADMIN không thể gán quyền ADMIN mới, chỉ giữ nguyên
    })
    .map((r) => ({
      label: r.name,
      value: r.name,
      disabled: r.name === "ADMIN",
    }));

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={isEdit ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      destroyOnHidden
      width={540}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="nva@restaurant.com" />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="0901234567" />
          </Form.Item>
        </div>

        {!isEdit && (
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            extra="Mật khẩu đăng nhập ban đầu cho nhân viên."
          >
            <Input.Password placeholder="••••••" />
          </Form.Item>
        )}

        <Form.Item
          name="roleIds"
          label="Vai trò"
          rules={[{ required: true, message: "Chọn 1 vai trò" }]}
        >
          <Select
            placeholder="Chọn vai trò..."
            options={roleOptions}
            optionFilterProp="label"
            disabled={isAdminEdit}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
