import React, { useState } from "react";
import { Modal, Descriptions, Tag, Button, Popconfirm, message, Divider, Space } from "antd";
import { Edit, Lock, Unlock, KeyRound, Mail, Phone, Shield, IdCard } from "lucide-react";
import { User, UserStatus, RoleResponse } from "@/types/user";
import { userService } from "@/services/user.service";

interface UserDetailModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: (user: User) => void;
  currentUserRole?: string;
}

const statusConfig: Record<UserStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Hoạt động", color: "success" },
  INACTIVE: { label: "Không hoạt động", color: "default" },
  LOCKED: { label: "Đã khóa", color: "error" },
};

const roleColorMap: Record<string, string> = {
  ADMIN: "red",
  MANAGER: "volcano",
  STAFF: "blue",
};

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  user,
  onClose,
  onRefresh,
  onEdit,
  currentUserRole,
}) => {
  const [loading, setLoading] = useState(false);

  if (!user) return null;
  const statusInfo = statusConfig[user.status];
  const isLocked = user.status === "LOCKED";

  const isTargetAdmin = user.roles.includes("ADMIN");
  const isTargetStaff = user.roles.includes("STAFF") || (!isTargetAdmin && !user.roles.includes("MANAGER"));

  let canEdit = false;
  let canLockOrReset = false;

  if (currentUserRole === "ADMIN") {
    canEdit = true;
    canLockOrReset = !isTargetAdmin; // ADMIN không thể tự khóa/reset tài khoản của mình
  } else if (currentUserRole === "MANAGER") {
    canEdit = isTargetStaff;
    canLockOrReset = isTargetStaff;
  }

  const handleToggleLock = async () => {
    try {
      setLoading(true);
      if (isLocked) {
        await userService.unlockUser(user.id);
        message.success("Đã mở khóa tài khoản.");
      } else {
        await userService.lockUser(user.id);
        message.success("Đã khóa tài khoản.");
      }
      onRefresh();
    } catch (error: any) {
      message.error(error.message || "Lỗi thao tác.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      await userService.resetPassword(user.id);
      message.success("Đã reset mật khẩu thành công.");
    } catch (error: any) {
      message.error(error.message || "Lỗi reset mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">{user.fullName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <span className="text-lg font-bold">{user.fullName}</span>
            <Tag color={statusInfo.color} className="ml-2">{statusInfo.label}</Tag>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={560}
    >
      <div className="space-y-5 mt-4">
        {/* Info grid */}
        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <IdCard size={16} className="text-zinc-400" />
            <span className="text-zinc-500 w-28">Mã NV:</span>
            <span className="font-mono font-medium text-zinc-700">{user.employeeId}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-zinc-400" />
            <span className="text-zinc-500 w-28">Email:</span>
            <span className="text-zinc-700">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-zinc-400" />
            <span className="text-zinc-500 w-28">Điện thoại:</span>
            <span className="text-zinc-700">{user.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield size={16} className="text-zinc-400" />
            <span className="text-zinc-500 w-28">Vai trò:</span>
            <div className="flex gap-1.5 flex-wrap">
              {user.roles.map((role) => (
                <Tag key={role} color={roleColorMap[role] || "default"}>
                  {role}
                </Tag>
              ))}
            </div>
          </div>
        </div>

        <Divider className="my-3" />

        {/* Actions - Phân quyền thao tác */}
        {(canEdit || canLockOrReset) && (
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <Button icon={<Edit size={16} />} onClick={() => onEdit(user)}>
                Chỉnh sửa
              </Button>
            )}

            {canLockOrReset && (
              <>
                <Popconfirm
                  title={isLocked ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}
                  description={
                    isLocked
                      ? "Nhân viên sẽ có thể đăng nhập trở lại."
                      : "Nhân viên sẽ không thể đăng nhập cho đến khi được mở khóa."
                  }
                  onConfirm={handleToggleLock}
                  okText={isLocked ? "Mở khóa" : "Khóa"}
                  cancelText="Hủy"
                  okButtonProps={isLocked ? {} : { danger: true }}
                >
                  <Button
                    loading={loading}
                    danger={!isLocked}
                    icon={isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                  >
                    {isLocked ? "Mở khóa" : "Khóa TK"}
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="Reset mật khẩu?"
                  description="Mật khẩu sẽ được đặt lại về giá trị mặc định."
                  onConfirm={handleResetPassword}
                  okText="Reset"
                  cancelText="Hủy"
                >
                  <Button loading={loading} icon={<KeyRound size={16} />}>
                    Reset mật khẩu
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
