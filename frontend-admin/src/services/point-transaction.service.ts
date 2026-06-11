// frontend/src/services/point-transaction.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import { PointTransaction, AdjustPointsRequest } from "@/types/payment";

export const pointTransactionService = {
  /**
   * GET /api/point-transactions/customer/{customerId}
   * Lịch sử điểm của khách hàng (phân trang) — CASHIER/ADMIN/MANAGER
   */
  async getByCustomerId(
    customerId: string,
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PaginatedData<PointTransaction>>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr
      ? `/point-transactions/customer/${customerId}?${queryStr}`
      : `/point-transactions/customer/${customerId}`;

    return apiClient<ApiResponse<PaginatedData<PointTransaction>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/point-transactions/invoice/{invoiceId}
   * Giao dịch điểm theo hóa đơn — CASHIER/ADMIN/MANAGER
   */
  async getByInvoiceId(invoiceId: string): Promise<ApiResponse<PointTransaction[]>> {
    return apiClient<ApiResponse<PointTransaction[]>>(
      `/point-transactions/invoice/${invoiceId}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  },

  /**
   * POST /api/point-transactions/adjust
   * Điều chỉnh điểm thủ công — ADMIN/MANAGER
   */
  async adjustPoints(data: AdjustPointsRequest): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>("/point-transactions/adjust", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },
};
