// frontend/src/types/user.ts

/** Trạng thái tài khoản — match backend UserStatus enum */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

/**
 * Thông tin user — match backend UserResponse DTO
 */
export interface User {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  roles: string[];
}

/**
 * Response đăng nhập — match backend AuthResponse DTO
 */
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * Request tạo/cập nhật user — match backend RegisterRequest DTO
 */
export interface RegisterRequest {
  fullName: string;
  phone?: string;
  email: string;
  password: string;
  roleIds: string[];
}

/**
 * Thông tin vai trò — match backend RoleResponse DTO
 */
export interface RoleResponse {
  id: string;
  name: string;
  description: string;
}
