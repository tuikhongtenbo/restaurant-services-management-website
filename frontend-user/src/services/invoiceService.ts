import { API_ENDPOINTS } from "../config/api";
import { ApiClient, getAuthHeaders } from "../utils/apiClient";

export interface InvoiceResponse {
  id: string;
  orderId: string;
  cashierId?: string;
  subtotal?: number;
  discountAmount?: number;
  totalAmount?: number;
  finalAmount?: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  changeAmount?: number;
  vatAmount?: number;
  customerPhone?: string;
}

export interface CheckoutRequest {
  orderId: string;           // UUID của order
  paymentMethod: string;     // "CASH"
  customerPhone?: string;
  voucherId?: string;
  pointsToUse?: number;
}

export const invoiceService = {
  // Thanh toán tiền mặt - trả về InvoiceResponse
  async checkoutCash(data: CheckoutRequest): Promise<InvoiceResponse> {
    const response = await ApiClient.post<{ data: InvoiceResponse }>(
      API_ENDPOINTS.PAYMENT.CASH,
      data,
      getAuthHeaders(),
    );
    // Backend trả { status, message, data: InvoiceResponse }
    return response.data;
  },

  async getInvoiceById(id: string): Promise<InvoiceResponse> {
    const response = await ApiClient.get<{ data: InvoiceResponse }>(
      API_ENDPOINTS.INVOICE.GET_BY_ID(id),
      getAuthHeaders(),
    );
    return response.data;
  },

  // In hoá đơn - mở cửa sổ in trực tiếp với HTML từ backend
  async printInvoice(invoiceId: string): Promise<void> {
    const url = API_ENDPOINTS.INVOICE.PRINT(invoiceId);
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Mở cửa sổ mới để in
      const win = window.open("", "_blank", "width=800,height=600");
      if (!win) {
        alert("Vui lòng cho phép popup để in hóa đơn!");
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.onload = () => {
        win.focus();
        win.print();
        setTimeout(() => win.close(), 2000);
      };
    } catch (err) {
      console.error("Print Invoice Error:", err);
      throw err;
    }
  },

  // Xuất hoá đơn dạng HTML modal (hiện trên trang)
  async getInvoiceHtml(invoiceId: string): Promise<string> {
    const url = API_ENDPOINTS.INVOICE.PRINT(invoiceId);
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  },
};
