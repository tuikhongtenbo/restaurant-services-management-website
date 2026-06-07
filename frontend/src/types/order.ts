// frontend/src/types/order.ts

/** Trạng thái đơn hàng — match backend OrderStatus enum */
export type OrderStatus = 'OPEN' | 'PAID' | 'CANCELLED';

/** Trạng thái món trong đơn — match backend OrderItemStatus enum */
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

/**
 * Chi tiết một món trong đơn — match backend OrderItemResponse DTO
 */
export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  note?: string;
  status: OrderItemStatus;
  orderedAt: string;
  readyAt?: string;
  servedAt?: string;
}

/**
 * Thông tin đơn hàng — match backend OrderResponse DTO
 */
export interface Order {
  id: string;
  tableId: string;
  tableNumber?: string;
  status: OrderStatus;
  guestCount?: number;
  waiterName?: string;
  items: OrderItem[];
  subtotal: number;
  openedAt: string;
  closedAt?: string;
}

/**
 * Request tạo đơn hàng — match backend CreateOrderRequest DTO
 */
export interface CreateOrderRequest {
  tableId: string;
  guestCount?: number;
}

/**
 * Option cho món ăn khi thêm vào đơn
 */
export interface OrderItemOption {
  optionName: string;
  optionValue: string;
}

/**
 * Request thêm món vào đơn — match backend AddOrderItemRequest DTO
 */
export interface AddOrderItemRequest {
  itemId: string;
  quantity: number;
  note?: string;
  options?: OrderItemOption[];
}

/**
 * Request cập nhật món trong đơn — match backend UpdateOrderItemRequest DTO
 */
export interface UpdateOrderItemRequest {
  quantity?: number;
  note?: string;
}

/**
 * Request hủy món trong đơn — match backend CancelOrderItemRequest DTO
 */
export interface CancelOrderItemRequest {
  reason: string;
}
