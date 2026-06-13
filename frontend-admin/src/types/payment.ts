// frontend/src/types/payment.ts

import { PaymentMethod } from './invoice';

/** Loại giao dịch điểm — match backend PointTransactionType enum */
export type PointTransactionType = 'EARNED' | 'REDEEMED' | 'ADJUSTED';

/**
 * Tóm tắt thông tin khách hàng trong checkout — match backend CustomerSummary DTO
 */
export interface CustomerSummary {
  customerId: string;
  name: string;
  phone: string;
  tier: string;
  totalPoints: number;
}

/**
 * Request checkout — match backend CheckoutRequest DTO
 */
export interface CheckoutRequest {
  orderId: string;
  customerPhone?: string;
  voucherId?: string;
  pointsToUse?: number;
  paymentMethod: PaymentMethod;
}

/**
 * Response preview checkout — match backend CheckoutResponse DTO
 */
export interface CheckoutResponse {
  orderId: string;
  subtotal: number;
  voucherCode?: string;
  voucherDiscount?: number;
  pointsUsed?: number;
  pointsDeducted?: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount: number;
  customer?: CustomerSummary;
  pointsEarned?: number;
}

/**
 * Response tạo thanh toán VNPay — match backend PaymentResponse DTO
 */
export interface PaymentResponse {
  paymentUrl: string;
  invoiceId: string;
  orderId: string;
}

/**
 * Request tạo VNPay payment — match backend VnpayCreateRequest DTO
 */
export interface VnpayCreateRequest {
  orderId: string;
  customerPhone?: string;
  voucherId?: string;
  pointsToUse?: number;
  bankCode?: string;
}

/**
 * Request hủy hóa đơn qua payment endpoint — match backend VoidInvoiceRequest (payment)
 */
export interface PaymentVoidInvoiceRequest {
  voidReason: string;
}

/**
 * Request điều chỉnh điểm thủ công — match backend AdjustPointsRequest DTO
 */
export interface AdjustPointsRequest {
  customerId: string;
  points: number;
  note?: string;
}

/**
 * Giao dịch điểm — match backend PointTransactionResponse DTO
 */
export interface PointTransaction {
  id: string;
  customerId: string;
  invoiceId?: string;
  type: PointTransactionType;
  points: number;
  note?: string;
  createdBy?: string;
  createdAt: string;
}
