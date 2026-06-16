import { API_ENDPOINTS } from "../config/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  BackendResponse,
  AuthData,
} from "../types/auth";
import type { User } from "../types/auth";
import { ApiClient, getAuthHeaders } from "../utils/apiClient";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    let response;
    try {
      // Thử đăng nhập với tư cách khách hàng trước
      response = await ApiClient.post<BackendResponse<AuthData>>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
      );
    } catch (customerError) {
      // Nếu đăng nhập khách hàng thất bại (ví dụ sai tài khoản), thử đăng nhập với tư cách nhân viên (staff)
      try {
        const staffCredentials = {
          email: credentials.loginId,
          password: credentials.password
        };
        response = await ApiClient.post<BackendResponse<AuthData>>(
          API_ENDPOINTS.AUTH.STAFF_LOGIN,
          staffCredentials,
        );
      } catch (staffError) {
        console.error("Login error (both customer and staff failed):", staffError);
        throw staffError;
      }
    }

    const authData = response.data;
    if (authData?.accessToken) {
      localStorage.setItem("authToken", authData.accessToken);
      localStorage.setItem("user", JSON.stringify(authData.user));
    }
    return authData;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Backend trả về: { status, message, data: { accessToken, tokenType, expiresIn, user } }
      const response = await ApiClient.post<BackendResponse<AuthData>>(
        API_ENDPOINTS.AUTH.REGISTER,
        data,
      );
      return response.data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await ApiClient.put<void>(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        data,
        getAuthHeaders(),
      );
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },

  async changeCustomerPassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await ApiClient.put<void>(
        API_ENDPOINTS.AUTH.CUSTOMER_CHANGE_PASSWORD,
        data,
        getAuthHeaders(),
      );
    } catch (error) {
      console.error("Change customer password error:", error);
      throw error;
    }
  },

  async updateCustomerInfo(data: { fullName: string; phone: string; email: string }): Promise<User> {
    try {
      const response = await ApiClient.put<BackendResponse<User>>(
        API_ENDPOINTS.AUTH.CUSTOMER_UPDATE,
        data,
        getAuthHeaders(),
      );
      return response.data;
    } catch (error) {
      console.error("Update customer info error:", error);
      throw error;
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    try {
      await ApiClient.post<void>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data,
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  getToken(): string | null {
    return localStorage.getItem("authToken");
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
