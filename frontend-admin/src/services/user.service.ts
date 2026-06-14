// frontend/src/services/user.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import { User, RegisterRequest, RoleResponse } from "@/types/user";

export const userService = {
  // ============ USER MANAGEMENT ============

  /**
   * GET /api/admin/users
   * Lấy danh sách user, hỗ trợ filter theo role và trạng thái
   */
  async getUsers(params?: {
    role?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<User>>> {
    const query = new URLSearchParams();
    if (params?.role) query.append("role", params.role);
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/admin/users?${queryStr}` : `/admin/users`;

    return apiClient<ApiResponse<PaginatedData<User>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/admin/users/{id}
   * Lấy chi tiết một user theo id
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiClient<ApiResponse<User>>(`/admin/users/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * POST /api/admin/users
   * Tạo user mới (nhân viên)
   */
  async createUser(data: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient<ApiResponse<User>>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/admin/users/{id}
   * Cập nhật thông tin user
   */
  async updateUser(id: string, data: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient<ApiResponse<User>>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/admin/users/{id}/lock
   * Khóa tài khoản user
   */
  async lockUser(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/admin/users/${id}/lock`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/admin/users/{id}/unlock
   * Mở khóa tài khoản user
   */
  async unlockUser(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/admin/users/${id}/unlock`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/admin/users/{id}/reset-password
   * Reset mật khẩu user về mặc định / gửi mật khẩu mới
   */
  async resetPassword(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/admin/users/${id}/reset-password`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  // ============ ROLE MANAGEMENT ============

  /**
   * GET /api/admin/roles
   * Lấy danh sách tất cả vai trò (role)
   */
  async getRoles(): Promise<ApiResponse<RoleResponse[]>> {
    return apiClient<ApiResponse<RoleResponse[]>>("/admin/roles", {
      method: "GET",
      requireAuth: true,
    });
  },
};
