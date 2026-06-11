// frontend/src/services/invoice.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PageResponse } from "@/types/common";
import { Invoice, VoidInvoiceRequest } from "@/types/invoice";

export const invoiceService = {
  /**
   * GET /api/invoices
   * Lấy danh sách hóa đơn, hỗ trợ filter theo ngày và thu ngân
   */
  async getInvoices(params?: {
    date?: string;
    cashierId?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<Invoice[]>>> {
    const query = new URLSearchParams();
    if (params?.date) query.append("date", params.date);
    if (params?.cashierId) query.append("cashierId", params.cashierId);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/invoices?${queryStr}` : `/invoices`;

    return apiClient<ApiResponse<PageResponse<Invoice[]>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/invoices/{id}
   * Lấy chi tiết một hóa đơn theo id
   */
  async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    return apiClient<ApiResponse<Invoice>>(`/invoices/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/invoices/order/{orderId}
   * Lấy hóa đơn gắn với một order cụ thể
   */
  async getInvoiceByOrderId(orderId: string): Promise<ApiResponse<Invoice>> {
    return apiClient<ApiResponse<Invoice>>(`/invoices/order/${orderId}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/invoices/{id}/void
   * Hủy hóa đơn kèm lý do (chỉ khi chưa void)
   */
  async voidInvoice(id: string, data: VoidInvoiceRequest): Promise<ApiResponse<Invoice>> {
    return apiClient<ApiResponse<Invoice>>(`/invoices/${id}/void`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * GET /api/invoices/{id}/print
   * Trả về HTML để in hóa đơn
   */
  async printInvoice(id: string): Promise<string> {
    return apiClient<string>(`/invoices/${id}/print`, {
      method: "GET",
      requireAuth: true,
    });
  },
};
