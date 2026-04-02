package com.restaurant.controller.order;

// SINH
// @RestController @RequestMapping("/api/orders")
//
// GET    /                          → Page<OrderResponse> (filter: status, date)
// GET    /table/{tableId}           → OrderResponse (don dang mo)
// GET    /{id}                      → OrderResponse
// POST   /                          → OrderResponse (tao don)
// PUT    /{id}/status               → OrderResponse (close order)
//
// POST   /{id}/items               → OrderItemResponse (them mon)
// PUT    /{orderId}/items/{itemId} → OrderItemResponse (sua/xoa)
// DELETE /{orderId}/items/{itemId} → void (huy mon)
// GET    /{id}/items               → List<OrderItemResponse>
public class OrderController {
}
