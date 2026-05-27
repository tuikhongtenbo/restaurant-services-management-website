package com.restaurant.service.order;

import com.restaurant.common.enums.OrderItemStatus;
import com.restaurant.dto.request.order.AddOrderItemRequest;
import com.restaurant.dto.request.order.UpdateOrderItemRequest;
import com.restaurant.dto.response.order.OrderItemResponse;

import java.util.List;
import java.util.UUID;

// Methods:
//   List<OrderItemResponse> getItemsByOrderId(UUID orderId)
//   OrderItemResponse addItem(UUID orderId, AddOrderItemRequest request, UUID orderedBy)
//   OrderItemResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request)
//   OrderItemResponse cancelItem(UUID orderId, UUID itemId, String reason, UUID cancelledBy)
//   OrderItemResponse updateItemStatus(UUID itemId, OrderItemStatus status)
//     → Neu status = READY → goi KdsNotificationService.notifyReady()
//     → Neu status = SERVED → kiem tra tat ca items da served chua
public interface OrderItemService {
    List<OrderItemResponse> getItemsByOrderId(UUID orderId);
    OrderItemResponse addItem(UUID orderId, AddOrderItemRequest request, UUID orderedBy);
    OrderItemResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request);
    OrderItemResponse cancelItem(UUID orderId, UUID itemId, String reason, UUID cancelledBy);
    OrderItemResponse updateItemStatus(UUID itemId, OrderItemStatus status);
}