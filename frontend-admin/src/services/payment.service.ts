// frontend/src/services/payment.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PageResponse } from "@/types/common";
import { Invoice } from "@/types/invoice";
import {
  CheckoutRequest,
  CheckoutResponse,
  PaymentResponse,
  VnpayCreateRequest,
  PaymentVoidInvoiceRequest,
} from "@/types/payment";

export const paymentService = {
  /**
   * POST /api/payments/checkout
   * Preview checkout — tính toán trước khi thanh toán (CASHIER/ADMIN/MANAGER)
   */
  async previewCheckout(data: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> {
    return apiClient<ApiResponse<CheckoutResponse>>("/payments/checkout", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * POST /api/payments/cash
   * Thanh toán tiền mặt (CASHIER/ADMIN/MANAGER)
   */
  async processCashPayment(data: CheckoutRequest): Promise<ApiResponse<Invoice>> {
    return apiClient<ApiResponse<Invoice>>("/payments/cash", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * POST /api/payments/vnpay/create
   * Tạo hóa đơn PENDING và URL redirect VNPay (CASHIER/ADMIN/MANAGER)
   */
  async createVnpayPayment(data: VnpayCreateRequest): Promise<ApiResponse<PaymentResponse>> {
    return apiClient<ApiResponse<PaymentResponse>>("/payments/vnpay/create", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * POST /api/payments/{id}/void
   * Hủy hóa đơn (ADMIN/MANAGER)
   */
  async voidInvoice(id: string, data: PaymentVoidInvoiceRequest): Promise<ApiResponse<Invoice>> {
    return apiClient<ApiResponse<Invoice>>(`/payments/${id}/void`, {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * GET /api/payments/invoices
   * Danh sách hóa đơn qua payment module (CASHIER/ADMIN/MANAGER)
   */
  async getInvoices(params?: {
    from?: string;
    cashierId?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<Invoice[]>>> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.cashierId) query.append("cashierId", params.cashierId);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/payments/invoices?${queryStr}` : `/payments/invoices`;

    return apiClient<ApiResponse<PageResponse<Invoice[]>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/payments/invoices/{id}
   * Chi tiết hóa đơn qua payment module (CASHIER/ADMIN/MANAGER)
   */
  async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    return apiClient<ApiResponse<Invoice>>(`/payments/invoices/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },
};
