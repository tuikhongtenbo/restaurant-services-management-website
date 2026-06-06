package com.restaurant.controller.order;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.utils.ApiResponse;
import com.restaurant.common.utils.PageResponse;
import com.restaurant.dto.request.order.AddOrderItemRequest;
import com.restaurant.dto.request.order.CancelOrderItemRequest;
import com.restaurant.dto.request.order.CreateOrderRequest;
import com.restaurant.dto.request.order.UpdateOrderItemRequest;
import com.restaurant.dto.response.order.OrderItemResponse;
import com.restaurant.dto.response.order.OrderResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.order.OrderItemService;
import com.restaurant.service.order.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// @RestController @RequestMapping("/api/orders")
//
// GET    /                          → Page<OrderResponse> (filter: status, date)
// GET    /table/{tableId}           → OrderResponse (đơn đang mở của bàn)
// GET    /{id}                      → OrderResponse
// POST   /                          → OrderResponse (tạo đơn mới, cần bàn EMPTY)
// PUT    /{id}/status/close         → OrderResponse (đóng đơn, bàn → CLEANING)
//
// POST   /{id}/items               → OrderItemResponse (thêm món vào đơn)
// PUT    /{orderId}/items/{itemId} → OrderItemResponse (sửa số lượng/ghi chú)
// DELETE /{orderId}/items/{itemId} → OrderItemResponse (huỷ món)
// GET    /{id}/items               → List<OrderItemResponse>
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final OrderItemService orderItemService;

    /**
     * GET /api/orders
     * Lấy danh sách order, hỗ trợ filter theo status và ngày.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<List<OrderResponse>>>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrders(status, date, pageable)));
    }

    /**
     * GET /api/orders/{id}
     * Lấy chi tiết một order theo id.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getById(id)));
    }

    /**
     * GET /api/orders/{id}/items
     * Lấy danh sách món của một order.
     */
    @GetMapping("/{id}/items")
    public ResponseEntity<ApiResponse<List<OrderItemResponse>>> getItems(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderItemService.getItemsByOrderId(id)));
    }

    /**
     * PUT /api/orders/{orderId}/items/{itemId}
     * Cập nhật số lượng hoặc ghi chú của một món (chỉ khi đang PENDING).
     */
    @PutMapping("/{orderId}/items/{itemId}")
    public ResponseEntity<ApiResponse<OrderItemResponse>> updateItem(
            @PathVariable UUID orderId, @PathVariable UUID itemId,
            @Valid @RequestBody UpdateOrderItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật món thành công",
                orderItemService.updateItem(orderId, itemId, request)));
    }

    /**
     * DELETE /api/orders/{orderId}/items/{itemId}
     * Huỷ một món trong order kèm lý do.
     */
    @DeleteMapping("/{orderId}/items/{itemId}")
    public ResponseEntity<ApiResponse<OrderItemResponse>> cancelItem(
            @PathVariable UUID orderId, @PathVariable UUID itemId,
            @Valid @RequestBody CancelOrderItemRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Huỷ món thành công",
                orderItemService.cancelItem(orderId, itemId, request.getReason(), userDetails.getId())));
    }

    /**
     * POST /api/orders
     * Tạo đơn mới: kiểm tra bàn trống, tạo Order, chuyển bàn → SERVING.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Tạo đơn thành công",
                orderService.createOrder(request, userDetails.getId())));
    }

    /**
     * GET /api/orders/table/{tableId}
     * Lấy đơn đang mở (status = OPEN) của một bàn cụ thể.
     */
    @GetMapping("/table/{tableId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOpenOrderByTable(@PathVariable UUID tableId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOpenOrderByTable(tableId)));
    }

    /**
     * POST /api/orders/{id}/items
     * Thêm món vào đơn: kiểm tra MenuItem AVAILABLE, snapshot giá/tên, lưu OrderItem.
     */
    @PostMapping("/{id}/items")
    public ResponseEntity<ApiResponse<OrderItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody AddOrderItemRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Thêm món thành công",
                orderItemService.addItem(id, request, userDetails.getId())));
    }

    /**
     * PUT /api/orders/{id}/status/close
     * Đóng đơn sau khi thanh toán: Order → PAID, Bàn → CLEANING.
     */
    @PutMapping("/{id}/status/close")
    public ResponseEntity<ApiResponse<OrderResponse>> closeOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Đóng đơn thành công",
                orderService.closeOrder(id)));
    }

    /**
     * PUT /api/orders/items/{itemId}/status
     * Cập nhật trạng thái món ăn (Bếp/Phục vụ).
     */
    @PutMapping("/items/{itemId}/status")
    public ResponseEntity<ApiResponse<OrderItemResponse>> updateItemStatus(
            @PathVariable UUID itemId,
            @RequestParam com.restaurant.common.enums.OrderItemStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công",
                orderItemService.updateItemStatus(itemId, status)));
    }
}