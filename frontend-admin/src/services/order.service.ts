// frontend/src/services/order.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PageResponse } from "@/types/common";
import {
  Order,
  OrderItem,
  OrderStatus,
  OrderItemStatus,
  CreateOrderRequest,
  AddOrderItemRequest,
  UpdateOrderItemRequest,
  CancelOrderItemRequest,
} from "@/types/order";

export const orderService = {
  /**
   * GET /api/orders
   * Lấy danh sách order, hỗ trợ filter theo status và ngày
   */
  async getOrders(params?: {
    status?: OrderStatus;
    date?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<Order[]>>> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.date) query.append("date", params.date);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/orders?${queryStr}` : `/orders`;

    return apiClient<ApiResponse<PageResponse<Order[]>>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/orders/{id}
   * Lấy chi tiết một order theo id
   */
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return apiClient<ApiResponse<Order>>(`/orders/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/orders/{id}/items
   * Lấy danh sách món của một order
   */
  async getOrderItems(orderId: string): Promise<ApiResponse<OrderItem[]>> {
    return apiClient<ApiResponse<OrderItem[]>>(`/orders/${orderId}/items`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/orders/table/{tableId}
   * Lấy đơn đang mở (status = OPEN) của một bàn cụ thể
   */
  async getOpenOrderByTable(tableId: string): Promise<ApiResponse<Order>> {
    return apiClient<ApiResponse<Order>>(`/orders/table/${tableId}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * POST /api/orders
   * Tạo đơn mới: kiểm tra bàn trống, tạo Order, chuyển bàn → SERVING
   */
  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return apiClient<ApiResponse<Order>>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * POST /api/orders/{id}/items
   * Thêm món vào đơn: kiểm tra MenuItem AVAILABLE, snapshot giá/tên, lưu OrderItem
   */
  async addItem(orderId: string, data: AddOrderItemRequest): Promise<ApiResponse<OrderItem>> {
    return apiClient<ApiResponse<OrderItem>>(`/orders/${orderId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/orders/{orderId}/items/{itemId}
   * Cập nhật số lượng hoặc ghi chú của một món (chỉ khi đang PENDING)
   */
  async updateItem(
    orderId: string,
    itemId: string,
    data: UpdateOrderItemRequest
  ): Promise<ApiResponse<OrderItem>> {
    return apiClient<ApiResponse<OrderItem>>(`/orders/${orderId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * DELETE /api/orders/{orderId}/items/{itemId}
   * Hủy một món trong order kèm lý do
   */
  async cancelItem(
    orderId: string,
    itemId: string,
    data: CancelOrderItemRequest
  ): Promise<ApiResponse<OrderItem>> {
    return apiClient<ApiResponse<OrderItem>>(`/orders/${orderId}/items/${itemId}`, {
      method: "DELETE",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/orders/{id}/status/close
   * Đóng đơn sau khi thanh toán: Order → PAID, Bàn → CLEANING
   */
  async closeOrder(id: string): Promise<ApiResponse<Order>> {
    return apiClient<ApiResponse<Order>>(`/orders/${id}/status/close`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/orders/items/{itemId}/status?status={status}
   * Cập nhật trạng thái món ăn (Bếp/Phục vụ)
   */
  async updateItemStatus(itemId: string, status: OrderItemStatus): Promise<ApiResponse<OrderItem>> {
    return apiClient<ApiResponse<OrderItem>>(`/orders/items/${itemId}/status?status=${status}`, {
      method: "PUT",
      requireAuth: true,
    });
  },
};
