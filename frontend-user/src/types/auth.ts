// Authentication Types

// Request: Login dùng "loginId" (email hoặc phone) theo backend API
export interface LoginRequest {
  loginId: string;  // backend yêu cầu "loginId" thay vì "email"
  password: string;
}

// Response wrapper từ backend: { timestamp, status, message, data: {...} }
export interface BackendResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data: T;
}

export interface AuthData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// Request: Register dùng "fullName" và "phone" theo backend API
export interface RegisterRequest {
  fullName: string;  // backend yêu cầu "fullName" thay vì "name"
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
  tier?: string;
  totalSpent?: number;
  currentPoints?: number;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
}
