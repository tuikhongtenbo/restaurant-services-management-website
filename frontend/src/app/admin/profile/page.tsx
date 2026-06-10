"use client";

import React, { useEffect, useState } from "react";
import { Card, Descriptions, Button, Spin, Tag, message } from "antd";
import { UserSquare2, KeyRound } from "lucide-react";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { User, RoleResponse } from "@/types/user";
import { ChangePasswordModal } from "@/components/admin/layout/ChangePasswordModal";
import { EditProfileModal } from "@/components/admin/profile/EditProfileModal";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, rolesRes] = await Promise.all([
        authService.getCurrentUser(),
        userService.getRoles(),
      ]);
      setUser(userRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      message.error("Không thể tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <div>Không có dữ liệu người dùng.</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserSquare2 size={24} />
          Thông tin cá nhân
        </h1>
        <p className="text-gray-500">Xem và quản lý thông tin tài khoản của bạn</p>
      </div>

      <Card className="max-w-3xl shadow-sm border border-gray-100">
        <Descriptions title="Chi tiết tài khoản" bordered column={1}>
          <Descriptions.Item label="Mã nhân viên">
            <span className="font-semibold text-blue-600">{user.employeeId}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Họ và tên">
            {user.fullName}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {user.email}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {user.phone || "Chưa cập nhật"}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <div className="flex gap-2">
              {user.roles.map((role) => (
                <Tag color={role === "ADMIN" ? "red" : role === "MANAGER" ? "gold" : "blue"} key={role}>
                  {role}
                </Tag>
              ))}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={user.status === "ACTIVE" ? "green" : "red"}>
              {user.status === "ACTIVE" ? "Đang hoạt động" : "Bị khóa"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <div className="mt-8 flex justify-end gap-3">
          <Button 
            onClick={() => setIsEditProfileOpen(true)}
            size="large"
          >
            Chỉnh sửa thông tin
          </Button>
          <Button 
            type="primary" 
            icon={<KeyRound size={16} />} 
            onClick={() => setIsChangePasswordOpen(true)}
            size="large"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </Card>

      <EditProfileModal
        open={isEditProfileOpen}
        user={user}
        roles={roles}
        onCancel={() => setIsEditProfileOpen(false)}
        onSuccess={() => {
          setIsEditProfileOpen(false);
          loadData();
        }}
      />

      <ChangePasswordModal 
        open={isChangePasswordOpen} 
        onCancel={() => setIsChangePasswordOpen(false)} 
        onSuccess={() => setIsChangePasswordOpen(false)} 
      />
    </div>
  );
}
