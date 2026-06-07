// frontend/src/services/table.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import { Table, CreateTableRequest, TableLayoutResponse, TableStatus } from "@/types/table";

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
    // Chuyển object params thành query string (VD: ?area=A&status=AVAILABLE)
    const query = new URLSearchParams(params as any).toString();
    const endpoint = query ? `/tables?${query}` : `/tables`;
    
    return apiClient<ApiResponse<PaginatedData<Table>>>(endpoint, {
      method: "GET",
      requireAuth: true, // Vì Controller gắn @PreAuthorize("hasAnyRole(...)")
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
   * POST /api/tables/{id}/open
   * Mở bàn cho khách vào ngồi
   */
  async openTable(tableId: string, data: { partySize: number; note?: string }): Promise<ApiResponse<Table>> {
    return apiClient<ApiResponse<Table>>(`/tables/${tableId}/open`, {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }
};
