import { API_ENDPOINTS } from "../config/api";
import { ApiClient, getAuthHeaders } from "../utils/apiClient";

export interface RestaurantTable {
  id: string;
  number: string;
  capacity: number;
  status: string; // AVAILABLE, SERVING, RESERVED, CLEANING, ...
  isActive?: boolean;
  is_active?: boolean;
  area?: string;
  updatedAt?: string;
}

interface TablePageResponse {
  content: RestaurantTable[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiWrappedResponse<T> {
  status: number;
  message: string;
  data: T;
}

export const tableService = {
  async getTables(): Promise<RestaurantTable[]> {
    try {
      // Backend trả Page<TableResponse> nên cần lấy .data.content
      const response = await ApiClient.get<ApiWrappedResponse<TablePageResponse>>(
        `${API_ENDPOINTS.TABLES.GET_ALL}?size=100`,
        getAuthHeaders()
      );
      return response?.data?.content ?? [];
    } catch (error) {
      console.error("Table service error:", error);
      return [];
    }
  },

  async openTable(tableId: string, actualGuestCount: number): Promise<RestaurantTable | null> {
    try {
      const response = await ApiClient.post<ApiWrappedResponse<RestaurantTable>>(
        API_ENDPOINTS.TABLES.OPEN(tableId),
        { actualGuestCount },
        getAuthHeaders()
      );
      return response?.data ?? null;
    } catch (error) {
      console.error("Open table error:", error);
      throw error;
    }
  },

  async closeTable(tableId: string): Promise<RestaurantTable | null> {
    try {
      const response = await ApiClient.post<ApiWrappedResponse<RestaurantTable>>(
        API_ENDPOINTS.TABLES.CLOSE(tableId),
        {},
        getAuthHeaders()
      );
      return response?.data ?? null;
    } catch (error) {
      console.error("Close table error:", error);
      throw error;
    }
  },
};

