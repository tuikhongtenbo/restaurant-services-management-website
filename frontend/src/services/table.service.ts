// frontend/src/services/table.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import { Table, CreateTableRequest, UpdateTableRequest, OpenTableRequest, TableLayoutResponse, TableStatus } from "@/types/table";

export const tableService = {
  /**
   * GET /api/tables
   * Lấy danh sách bàn (có hỗ trợ lọc theo khu vực, trạng thái và phân trang)
   */
  async getTables(params?: { 
    area?: string; 
    status?: TableStatus; 
    page?: number; 
    size?: number 
  }): Promise<ApiResponse<PaginatedData<Table>>> {
    const query = new URLSearchParams(params as any).toString();
    const endpoint = query ? `/tables?${query}` : `/tables`;
    
    return apiClient<ApiResponse<PaginatedData<Table>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/tables/layout
   * Lấy sơ đồ bàn theo khu vực
   */
  async getTableLayout(): Promise<ApiResponse<TableLayoutResponse>> {
    return apiClient<ApiResponse<TableLayoutResponse>>("/tables/layout", {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/tables/available
   * Lấy danh sách bàn trống phù hợp với sức chứa và thời gian
   */
  async getAvailableTables(capacity: number, dateTime: string): Promise<ApiResponse<Table[]>> {
    const query = new URLSearchParams({ capacity: String(capacity), dateTime }).toString();
    return apiClient<ApiResponse<Table[]>>(`/tables/available?${query}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/tables/{id}
   * Lấy chi tiết một bàn theo id
   */
  async getTableById(id: string): Promise<ApiResponse<Table>> {
    return apiClient<ApiResponse<Table>>(`/tables/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * POST /api/tables
   * Tạo bàn mới (Chỉ dành cho ADMIN/MANAGER)
   */
  async createTable(data: CreateTableRequest): Promise<ApiResponse<Table>> {
    return apiClient<ApiResponse<Table>>("/tables", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/tables/{id}
   * Cập nhật thông tin bàn (Chỉ dành cho ADMIN/MANAGER)
   */
  async updateTable(id: string, data: UpdateTableRequest): Promise<ApiResponse<Table>> {
    return apiClient<ApiResponse<Table>>(`/tables/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * DELETE /api/tables/{id}
   * Xóa bàn (Chỉ dành cho ADMIN/MANAGER)
   */
  async deleteTable(id: string): Promise<ApiResponse<void>> {
    return apiClient<ApiResponse<void>>(`/tables/${id}`, {
      method: "DELETE",
      requireAuth: true,
    });
  },

  /**
   * POST /api/tables/{id}/open
   * Mở bàn cho khách vào ngồi
   */
  async openTable(id: string, data: OpenTableRequest): Promise<ApiResponse<Table>> {
    return apiClient<ApiResponse<Table>>(`/tables/${id}/open`, {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * POST /api/tables/{id}/close
   * Đóng bàn (chuyển về CLEANING hoặc EMPTY)
   */
  async closeTable(id: string): Promise<ApiResponse<Table>> {
    return apiClient<ApiResponse<Table>>(`/tables/${id}/close`, {
      method: "POST",
      requireAuth: true,
    });
  },
};
