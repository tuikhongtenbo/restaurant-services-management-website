"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Table, Tag, Select, message, Spin, Card, Tooltip, Input, Avatar, Badge } from "antd";
import { Plus, RefreshCw, Users, ShieldCheck, Lock, Eye } from "lucide-react";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { User, UserStatus, RoleResponse } from "@/types/user";
import { UserFormModal } from "@/components/admin/users/UserFormModal";
import { UserDetailModal } from "@/components/admin/users/UserDetailModal";

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

const avatarColorMap: Record<string, string> = {
  ADMIN: "#ff4d4f",
  MANAGER: "#fa541c",
  STAFF: "#1677ff",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Roles list
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("STAFF");

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchRoles = async () => {
    try {
      const res = await userService.getRoles();
      setRoles(res.data);
    } catch {
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await authService.getCurrentUser();
      const roles = res.data.roles;
      if (roles.includes("ADMIN")) setCurrentUserRole("ADMIN");
      else if (roles.includes("MANAGER")) setCurrentUserRole("MANAGER");
      else setCurrentUserRole("STAFF");
    } catch {
      // ignore
    }
  };

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const roleParam = selectedRole === "ALL" ? undefined : selectedRole;
      const statusParam = selectedStatus === "ALL" ? undefined : selectedStatus;

      const res = await userService.getUsers({
        role: roleParam,
        status: statusParam,
        page: currentPage - 1,
        size: pageSize,
      });

      const data = res.data;
      setUsers(data.content);
      setTotalElements(data.totalElements);
    } catch (error: any) {
      message.error(error.message || "Lỗi tải danh sách nhân viên");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRole, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchRoles();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => fetchData(true);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleEdit = (user: User) => {
    setDetailOpen(false);
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingUser(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    fetchData(true);
  };

  // Stats
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const lockedCount = users.filter((u) => u.status === "LOCKED").length;

  const columns = [
    {
      title: "Nhân viên",
      key: "user",
      render: (_: any, record: User) => {
        const primaryRole = record.roles[0] || "WAITER";
        const bgColor = avatarColorMap[primaryRole] || "#1677ff";
        return (
          <div className="flex items-center gap-3">
            <Avatar style={{ backgroundColor: bgColor }} size={40}>
              {record.fullName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <p className="font-semibold text-zinc-800 text-sm leading-tight">{record.fullName}</p>
              <p className="text-xs text-zinc-400 font-mono">{record.employeeId}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (val: string) => <span className="text-sm text-zinc-600">{val}</span>,
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (val: string) => val || <span className="text-zinc-300">—</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "roles",
      key: "roles",
      width: 100,
      render: (roles: string[]) => (
        <div className="flex gap-1 flex-wrap">
          {roles.map((role) => (
            <Tag key={role} color={roleColorMap[role] || "default"} className="text-xs">
              {role}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: UserStatus) => {
        const cfg = statusConfig[status];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Nhân sự</h1>
          <p className="text-zinc-500 mt-1">Danh sách tài khoản nhân viên</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedRole}
            onChange={(v) => { setSelectedRole(v); setCurrentPage(1); }}
            className="w-40"
            options={[
              { value: "ALL", label: "Tất cả vai trò" },
              ...roles.map((r) => ({ value: r.name, label: r.name })),
            ]}
          />
          <Select
            value={selectedStatus}
            onChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
            className="w-40"
            options={[
              { value: "ALL", label: "Tất cả TT" },
              { value: "ACTIVE", label: "Hoạt động" },
              { value: "INACTIVE", label: "Không hoạt động" },
              { value: "LOCKED", label: "Đã khóa" },
            ]}
          />
          <Button
            icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
          {(currentUserRole === "ADMIN" || currentUserRole === "MANAGER") && (
            <Button type="primary" icon={<Plus size={16} />} onClick={handleCreateNew}>
              Thêm NV
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card size="small" className="bg-zinc-50 border-zinc-200">
          <div className="text-zinc-500 text-sm font-medium flex items-center gap-1.5">
            <Users size={14} /> Tổng nhân viên
          </div>
          <div className="text-2xl font-bold mt-1 text-zinc-800">{totalElements}</div>
        </Card>
        <Card size="small" className="bg-emerald-50/50 border-emerald-100">
          <div className="text-emerald-600 text-sm font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} /> Đang hoạt động
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{activeCount}</div>
        </Card>
        <Card size="small" className="bg-rose-50/50 border-rose-100">
          <div className="text-rose-600 text-sm font-medium flex items-center gap-1.5">
            <Lock size={14} /> Đã khóa
          </div>
          <div className="text-2xl font-bold mt-1 text-rose-700">{lockedCount}</div>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalElements,
            onChange: (p, s) => { setCurrentPage(p); setPageSize(s); },
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhân viên`,
          }}
          onRow={(record) => ({
            className: "cursor-pointer hover:bg-zinc-50 transition-colors",
            onClick: () => handleViewUser(record),
          })}
        />
      </div>

      {/* Detail Modal */}
      <UserDetailModal
        open={detailOpen}
        user={selectedUser}
        currentUserRole={currentUserRole}
        onClose={() => setDetailOpen(false)}
        onRefresh={() => { fetchData(true); setDetailOpen(false); }}
        onEdit={handleEdit}
      />

      {/* Form Modal */}
      <UserFormModal
        open={formOpen}
        initialData={editingUser}
        roles={roles}
        currentUserRole={currentUserRole}
        onCancel={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
