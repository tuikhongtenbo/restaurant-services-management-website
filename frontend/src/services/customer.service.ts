// frontend/src/services/customer.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import { UserStatus } from "@/types/user";
import { 
  Customer, 
  PointTransaction, 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  AdjustPointsRequest 
} from "@/types/customer";

export const customerService = {
  /** GET /api/customers */
  async getAllCustomers(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<Customer>>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/customers?${queryStr}` : `/customers`;

    return apiClient<ApiResponse<PaginatedData<Customer>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /** GET /api/customers/search?phone= */
  async searchCustomer(phone: string): Promise<ApiResponse<Customer[]>> {
    return apiClient<ApiResponse<Customer[]>>(`/customers/search?phone=${phone}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /** GET /api/customers/{id} */
  async getCustomerById(id: string): Promise<ApiResponse<Customer>> {
    return apiClient<ApiResponse<Customer>>(`/customers/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /** POST /api/customers */
  async createCustomer(data: CreateCustomerRequest): Promise<ApiResponse<Customer>> {
    return apiClient<ApiResponse<Customer>>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /** PUT /api/customers/{id} */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> {
    return apiClient<ApiResponse<Customer>>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /** PUT /api/customers/{id}/status */
  async updateCustomerStatus(id: string, status: UserStatus): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/customers/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
      requireAuth: true,
    });
  },

  /** DELETE /api/customers/{id} */
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/customers/${id}`, {
      method: "DELETE",
      requireAuth: true,
    });
  },

  /** POST /api/customers/{id}/adjust-points */
  async adjustPoints(id: string, data: AdjustPointsRequest): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/customers/${id}/adjust-points`, {
      method: "POST",
      body: JSON.stringify({ ...data, customerId: id }),
      requireAuth: true,
    });
  },

  /** GET /api/customers/{id}/transactions */
  async getCustomerTransactions(
    id: string, 
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PaginatedData<PointTransaction>>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/customers/${id}/transactions?${queryStr}` : `/customers/${id}/transactions`;

    return apiClient<ApiResponse<PaginatedData<PointTransaction>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },
};
