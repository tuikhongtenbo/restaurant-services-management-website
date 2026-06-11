// frontend/src/services/menu.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import { MenuItem, MenuItemStatus, CreateMenuItemRequest, UpdateMenuItemRequest, PriceHistoryResponse } from "@/types/menu";

export const menuService = {
  // ============ ITEMS ENDPOINTS ============

  /**
   * GET /api/menu/items
   * Lấy danh sách món ăn (filter: category, status, tag) — ADMIN/MANAGER only
   */
  async getItems(params?: {
    category?: string;
    status?: MenuItemStatus;
    tag?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<MenuItem>>> {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.status) query.append("status", params.status);
    if (params?.tag) query.append("tag", params.tag);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/menu/items?${queryStr}` : `/menu/items`;

    return apiClient<ApiResponse<PaginatedData<MenuItem>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/menu/items/{id}
   * Lấy chi tiết món ăn — ADMIN/MANAGER only
   */
  async getItemById(id: string): Promise<ApiResponse<MenuItem>> {
    return apiClient<ApiResponse<MenuItem>>(`/menu/items/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/menu/items/{id}/price-history
   * Lấy lịch sử giá của món ăn — ADMIN/MANAGER only
   */
  async getPriceHistory(id: string): Promise<ApiResponse<PriceHistoryResponse>> {
    return apiClient<ApiResponse<PriceHistoryResponse>>(`/menu/items/${id}/price-history`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * POST /api/menu/items
   * Tạo mới món ăn — ADMIN/MANAGER only
   */
  async createItem(data: CreateMenuItemRequest): Promise<ApiResponse<MenuItem>> {
    return apiClient<ApiResponse<MenuItem>>("/menu/items", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/menu/items/{id}
   * Cập nhật thông tin món ăn — ADMIN/MANAGER only
   */
  async updateItem(id: string, data: UpdateMenuItemRequest): Promise<ApiResponse<MenuItem>> {
    return apiClient<ApiResponse<MenuItem>>(`/menu/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/menu/items/{id}/price?price={price}
   * Cập nhật giá của món ăn — ADMIN/MANAGER only
   */
  async updatePrice(id: string, price: number): Promise<ApiResponse<MenuItem>> {
    return apiClient<ApiResponse<MenuItem>>(`/menu/items/${id}/price?price=${price}`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/menu/items/{id}/status?status={status}
   * Cập nhật trạng thái của món ăn — ADMIN/MANAGER only
   */
  async updateStatus(id: string, status: MenuItemStatus): Promise<ApiResponse<MenuItem>> {
    return apiClient<ApiResponse<MenuItem>>(`/menu/items/${id}/status?status=${status}`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/menu/items/{id}/sort-order?sortOrder={sortOrder}
   * Cập nhật thứ tự hiển thị của món ăn — ADMIN/MANAGER only
   */
  async updateSortOrder(id: string, sortOrder: number): Promise<ApiResponse<MenuItem>> {
    return apiClient<ApiResponse<MenuItem>>(`/menu/items/${id}/sort-order?sortOrder=${sortOrder}`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * DELETE /api/menu/items/{id}
   * Xóa (soft delete) món ăn — ADMIN/MANAGER only
   */
  async deleteItem(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/menu/items/${id}`, {
      method: "DELETE",
      requireAuth: true,
    });
  },

  // ============ PUBLIC ENDPOINTS ============

  /**
   * GET /api/menu/public
   * Lấy danh sách món ăn công khai (AVAILABLE) — Public
   */
  async getPublicMenu(params?: {
    category?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<MenuItem>>> {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/menu/public?${queryStr}` : `/menu/public`;

    return apiClient<ApiResponse<PaginatedData<MenuItem>>>(endpoint, {
      method: "GET",
      requireAuth: false,
    });
  },

  /**
   * GET /api/menu/recommended
   * Lấy danh sách món ăn được gợi ý — Public
   */
  async getRecommended(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<MenuItem>>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/menu/recommended?${queryStr}` : `/menu/recommended`;

    return apiClient<ApiResponse<PaginatedData<MenuItem>>>(endpoint, {
      method: "GET",
      requireAuth: false,
    });
  },
};
