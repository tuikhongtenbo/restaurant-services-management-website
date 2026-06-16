import { API_ENDPOINTS } from "../config/api";
import { ApiClient, getAuthHeaders } from "../utils/apiClient";

export interface OrderItemResponse {
  id: string;
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  status: string;
}

export interface OrderResponse {
  id: string;
  tableId: string;
  waiterId: string;
  guestCount: number;
  status: string;
  openedAt: string;
  closedAt?: string;
  items: OrderItemResponse[];
  subtotal?: number;
}

export interface CreateOrderRequest {
  tableId: string;
  guestCount: number;
}

export interface AddOrderItemRequest {
  itemId: string;
  quantity: number;
  note?: string;
}

export interface UpdateOrderItemRequest {
  quantity?: number;
  note?: string;
}

export const orderService = {
  async createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    const response = await ApiClient.post<{ data: OrderResponse }>(
      API_ENDPOINTS.ORDERS.CREATE,
      data,
      getAuthHeaders(),
    );
    return response.data;
  },

  async getOpenOrderByTable(tableId: string): Promise<OrderResponse> {
    try {
      const response = await ApiClient.get<{ data: OrderResponse }>(
        API_ENDPOINTS.ORDERS.GET_BY_TABLE(tableId),
        getAuthHeaders(),
      );
      return response.data;
    } catch (err) {
      // Workaround for potential backend errors (e.g., LazyInitializationException)
      const allOrders = await this.getAllOrders();
      const openOrder = allOrders.find(
        (o) => o.tableId === tableId && o.status === "OPEN"
      );
      if (openOrder) {
        return openOrder;
      }
      throw err;
    }
  },

  async getAllOrders(): Promise<OrderResponse[]> {
    const response = await ApiClient.get<{ data: { data: OrderResponse[] } }>(
      `${API_ENDPOINTS.ORDERS.GET_ALL}?size=1000`,
      getAuthHeaders(),
    );
    return response.data.data || [];
  },

  async addOrderItem(
    orderId: string,
    data: AddOrderItemRequest,
  ): Promise<OrderItemResponse> {
    const response = await ApiClient.post<{ data: OrderItemResponse }>(
      API_ENDPOINTS.ORDERS.ADD_ITEM(orderId),
      data,
      getAuthHeaders(),
    );
    return response.data;
  },

  async updateOrderItem(
    orderId: string,
    itemId: string,
    data: UpdateOrderItemRequest,
  ): Promise<OrderItemResponse> {
    const response = await ApiClient.put<{ data: OrderItemResponse }>(
      API_ENDPOINTS.ORDERS.UPDATE_ITEM(orderId, itemId),
      data,
      getAuthHeaders(),
    );
    return response.data;
  },

  async updateItemStatus(itemId: string, status: string): Promise<OrderItemResponse> {
    const response = await ApiClient.put<{ data: OrderItemResponse }>(
      `${API_ENDPOINTS.ORDERS.UPDATE_ITEM_STATUS(itemId)}?status=${status}`,
      null,
      getAuthHeaders(),
    );
    return response.data;
  },

  async closeOrder(orderId: string): Promise<OrderResponse> {
    const response = await ApiClient.put<{ data: OrderResponse }>(
      API_ENDPOINTS.ORDERS.CLOSE(orderId),
      {},
      getAuthHeaders(),
    );
    return response.data;
  },
};
