// frontend/src/types/voucher.ts

/** Loại giảm giá voucher — match backend VoucherDiscountType enum */
export type VoucherDiscountType = 'PERCENT' | 'FIXED';

/** Hạng khách hàng — match backend CustomerTier enum */
export type CustomerTier = 'MEMBER' | 'BRONZE' | 'SILVER' | 'GOLD';

/**
 * Thông tin voucher — match backend VoucherResponse DTO
 */
export interface Voucher {
  id: string;
  code: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderValue?: number;
  minTier?: CustomerTier;
  minPoints?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Request tạo voucher — match backend CreateVoucherRequest DTO
 */
export interface CreateVoucherRequest {
  code: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderValue?: number;
  minTier?: CustomerTier;
  minPoints?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
}

/**
 * Request cập nhật voucher — match backend UpdateVoucherRequest DTO
 */
export interface UpdateVoucherRequest {
  description?: string;
  discountType?: VoucherDiscountType;
  discountValue?: number;
  minOrderValue?: number;
  minTier?: CustomerTier;
  minPoints?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  isActive?: boolean;
}
