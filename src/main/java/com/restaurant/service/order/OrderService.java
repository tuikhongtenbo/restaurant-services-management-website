package com.restaurant.service.order;

// THY
// TODO: @Service
// Methods:
//   Page<OrderResponse> getOrders(OrderStatus status, LocalDate date, Pageable pageable)
//   OrderResponse getById(UUID id)
//   OrderResponse getOpenOrderByTable(UUID tableId)
//   OrderResponse createOrder(CreateOrderRequest request, UUID waiterId) → tao don + cap nhat table status = SERVING
//   OrderResponse updateOrderStatus(UUID id, OrderStatus status)
//   void closeOrder(UUID orderId) → table = EMPTY/CLEANING
public interface OrderService {
}
