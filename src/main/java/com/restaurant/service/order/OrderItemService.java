package com.restaurant.service.order;

// THY
// TODO: @Service
// Methods:
//   List<OrderItemResponse> getItemsByOrderId(UUID orderId)
//   OrderItemResponse addItem(UUID orderId, AddOrderItemRequest request, UUID orderedBy)
//   OrderItemResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request)
//   OrderItemResponse cancelItem(UUID orderId, UUID itemId, String reason, UUID cancelledBy)
//   OrderItemResponse updateItemStatus(UUID itemId, OrderItemStatus status)
//     → Neu status = READY → goi KdsNotificationService.notifyReady()
//     → Neu status = SERVED → kiem tra tat ca items da served chua
public interface OrderItemService {
}
