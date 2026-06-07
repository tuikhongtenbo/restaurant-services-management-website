// frontend/src/services/auth.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/common";
import { AuthResponse, User } from "@/types/user";

export const authService = {
  /**
   * Gọi API đăng nhập cho Admin/Nhân viên
   */
  async login(credentials: Record<string, string>): Promise<ApiResponse<AuthResponse>> {
    return apiClient<ApiResponse<AuthResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      requireAuth: false, // Login thì không cần token
    });
  },

  /**
   * Lấy thông tin user đang đăng nhập
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient<ApiResponse<User>>("/auth/me", {
      method: "GET",
      requireAuth: true, // Phải có token mới lấy được
    });
  },
};
