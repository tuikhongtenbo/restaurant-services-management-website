import { UserStatus } from './user';

/** Loại giao dịch điểm */
export type PointTransactionType = 'EARN' | 'REDEEM' | 'ADJUST';

/** Thông tin Khách hàng (CustomerResponse) */
export interface Customer {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  status: UserStatus;
  tier: string;
  totalSpent: number;
  currentPoints: number;
}

/** Thông tin giao dịch điểm (PointTransactionResponse) */
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

/** Request tạo Khách hàng */
export interface CreateCustomerRequest {
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
}

/** Request cập nhật Khách hàng */
export interface UpdateCustomerRequest {
  fullName: string;
  phone: string;
  email?: string;
}

/** Request điều chỉnh điểm */
export interface AdjustPointsRequest {
  points: number;
  note: string;
}
