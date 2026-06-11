// frontend/src/types/invoice.ts

/** Trạng thái hóa đơn — match backend InvoiceStatus enum */
export type InvoiceStatus = 'PENDING' | 'PAID' | 'VOIDED';

/** Phương thức thanh toán — match backend PaymentMethod enum */
export type PaymentMethod = 'CASH' | 'VNPAY';

/**
 * Thông tin hóa đơn — match backend InvoiceResponse DTO (order module)
 */
export interface Invoice {
  id: string;
  orderId: string;
  cashierName?: string;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  voucherCode?: string;
  paymentMethod: PaymentMethod;
  pointsUsed?: number;
  pointsEarned?: number;
  status: InvoiceStatus;
  voidReason?: string;
  createdAt: string;
}

/**
 * Request hủy hóa đơn — match backend VoidInvoiceRequest DTO
 */
export interface VoidInvoiceRequest {
  reason: string;
}
