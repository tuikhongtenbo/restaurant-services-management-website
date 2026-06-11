// frontend/src/services/voucher.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import { Voucher, CreateVoucherRequest, UpdateVoucherRequest } from "@/types/voucher";

export const voucherService = {
  /**
   * GET /api/vouchers
   * Danh sách tất cả voucher (phân trang) — ADMIN/MANAGER
   */
  async getAllVouchers(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<Voucher>>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/vouchers?${queryStr}` : `/vouchers`;

    return apiClient<ApiResponse<PaginatedData<Voucher>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/vouchers/{id}
   * Chi tiết voucher theo ID — ADMIN/MANAGER
   */
  async getVoucherById(id: string): Promise<ApiResponse<Voucher>> {
    return apiClient<ApiResponse<Voucher>>(`/vouchers/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/vouchers/code/{code}
   * Tìm voucher theo mã — CASHIER/ADMIN/MANAGER
   */
  async getVoucherByCode(code: string): Promise<ApiResponse<Voucher>> {
    return apiClient<ApiResponse<Voucher>>(`/vouchers/code/${code}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/vouchers/available
   * Danh sách voucher khả dụng (còn hạn, chưa hết lượt) — CASHIER/ADMIN/MANAGER
   */
  async getAvailableVouchers(): Promise<ApiResponse<Voucher[]>> {
    return apiClient<ApiResponse<Voucher[]>>("/vouchers/available", {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * POST /api/vouchers
   * Tạo voucher mới — ADMIN/MANAGER
   */
  async createVoucher(data: CreateVoucherRequest): Promise<ApiResponse<Voucher>> {
    return apiClient<ApiResponse<Voucher>>("/vouchers", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/vouchers/{id}
   * Cập nhật voucher — ADMIN/MANAGER
   */
  async updateVoucher(id: string, data: UpdateVoucherRequest): Promise<ApiResponse<Voucher>> {
    return apiClient<ApiResponse<Voucher>>(`/vouchers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PATCH /api/vouchers/{id}/toggle
   * Bật/tắt trạng thái voucher — ADMIN/MANAGER
   */
  async toggleActive(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/vouchers/${id}/toggle`, {
      method: "PATCH",
      requireAuth: true,
    });
  },

  /**
   * DELETE /api/vouchers/{id}
   * Xóa (soft delete) voucher — ADMIN/MANAGER
   */
  async deleteVoucher(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/vouchers/${id}`, {
      method: "DELETE",
      requireAuth: true,
    });
  },
};
