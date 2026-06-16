import { API_ENDPOINTS } from "../config/api";
import { ApiClient, getAuthHeaders } from "../utils/apiClient";

export interface VoucherResponse {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  requiredTier?: string;
  requiredPoints?: number;
}

export const voucherService = {
  async getByCode(code: string): Promise<VoucherResponse> {
    const response = await ApiClient.get<{ data: VoucherResponse }>(
      API_ENDPOINTS.VOUCHERS.GET_BY_CODE(code),
      getAuthHeaders()
    );
    return response.data;
  },
};
