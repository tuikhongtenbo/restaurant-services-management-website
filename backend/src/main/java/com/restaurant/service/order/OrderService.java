package com.restaurant.service.order;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.utils.PageResponse;
import com.restaurant.dto.request.order.CreateOrderRequest;
import com.restaurant.dto.response.order.OrderResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// Methods:
//   Page<OrderResponse> getOrders(OrderStatus status, LocalDate date, Pageable pageable)
//   OrderResponse getById(UUID id)
//   OrderResponse getOpenOrderByTable(UUID tableId)
//   OrderResponse createOrder(CreateOrderRequest request, UUID waiterId) → tao don + cap nhat table status = SERVING
//   OrderResponse updateOrderStatus(UUID id, OrderStatus status)
//   void closeOrder(UUID orderId) → table = EMPTY/CLEANING
public interface OrderService {
    PageResponse<List<OrderResponse>> getOrders(OrderStatus status, LocalDate date, Pageable pageable);
    OrderResponse getById(UUID id);
    OrderResponse getOpenOrderByTable(UUID tableId);
    OrderResponse createOrder(CreateOrderRequest request, UUID waiterId);
    OrderResponse updateOrderStatus(UUID id, OrderStatus status);
    OrderResponse closeOrder(UUID orderId);
}