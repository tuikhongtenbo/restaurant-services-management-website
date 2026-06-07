package com.restaurant.service.order.impl;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.common.exceptions.ResourceNotFoundException;
import com.restaurant.common.utils.PageResponse;
import com.restaurant.dto.request.order.CreateOrderRequest;
import com.restaurant.dto.response.order.OrderItemResponse;
import com.restaurant.dto.response.order.OrderResponse;
import com.restaurant.model.Order;
import com.restaurant.model.Table;
import com.restaurant.repository.OrderRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.order.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final TableRepository tableRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy danh sách order, có thể filter theo status và ngày
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public PageResponse<List<OrderResponse>> getOrders(OrderStatus status, LocalDate date, Pageable pageable) {
        // Logic: Nếu có cả status và date → filter theo cả hai
        //        Nếu chỉ có status → filter theo status
        //        Nếu chỉ có date   → filter theo khoảng thời gian trong ngày
        //        Nếu không có gì   → lấy tất cả
        Page<Order> page;

        if (status != null && date != null) {
            OffsetDateTime from = date.atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime to   = date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
            page = orderRepository.findByStatusAndOpenedAtBetween(status, from, to, pageable);
        } else if (status != null) {
            page = orderRepository.findByStatus(status, pageable);
        } else if (date != null) {
            OffsetDateTime from = date.atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime to   = date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
            page = orderRepository.findByOpenedAtBetween(from, to, pageable);
        } else {
            page = orderRepository.findAll(pageable);
        }

        List<Order> orders = page.getContent();
        
        // Fix N+1 Query: Fetch all tables for the current page in one go
        List<UUID> tableIds = orders.stream().map(Order::getTableId).distinct().collect(Collectors.toList());
        java.util.Map<UUID, String> tableNumberMap = tableRepository.findAllById(tableIds).stream()
                .collect(Collectors.toMap(Table::getId, Table::getNumber));

        List<OrderResponse> content = orders.stream()
                .map(order -> mapToResponse(order, tableNumberMap.get(order.getTableId())))
                .collect(Collectors.toList());

        // PageResponse.of() là static factory của record PageResponse
        return PageResponse.<OrderResponse>of(content, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy một order theo id
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public OrderResponse getById(UUID id) {
        // Logic: Tìm order theo id, nếu không tìm thấy → ném ResourceNotFoundException
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy order đang mở của một bàn (status = OPEN)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public OrderResponse getOpenOrderByTable(UUID tableId) {
        // Logic: Tìm order có tableId khớp và status = OPEN
        Order order = orderRepository.findByTableIdAndStatus(tableId, OrderStatus.OPEN)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "tableId (OPEN)", tableId));
        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE: Tạo order mới
    //  1. Kiểm tra bàn có tồn tại không
    //  2. Kiểm tra bàn phải đang trống (EMPTY) — nếu không → ném BusinessException
    //  3. Tạo Order mới và lưu vào DB
    //  4. Cập nhật trạng thái bàn → SERVING (đang phục vụ)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, UUID waiterId) {
        // Bước 1: Tìm bàn, ném lỗi nếu không tồn tại
        Table table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table", "id", request.getTableId()));

        // Bước 2: Kiểm tra trạng thái bàn — EMPTY hoặc SERVING (đã check-in đặt bàn) chưa có order OPEN
        if (table.getStatus() == TableStatus.EMPTY) {
            // ok
        } else if (table.getStatus() == TableStatus.SERVING
                && !orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            // Khách đặt bàn đã arrived, chưa mở order
        } else {
            throw new BusinessException("Bàn đang không trống, không thể tạo đơn mới!");
        }

        // Bước 3: Tạo và lưu Order
        Order order = Order.builder()
                .tableId(request.getTableId())
                .guestCount(request.getGuestCount())
                .waiterId(waiterId)
                .build();
        Order saved = orderRepository.save(order);

        // Bước 4: Cập nhật bàn sang trạng thái SERVING
        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);

        return mapToResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE: Thay đổi trạng thái order thủ công (dùng cho admin/manager)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID id, OrderStatus status) {
        // Logic: Lấy order và cập nhật trạng thái được yêu cầu
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        order.setStatus(status);
        orderRepository.save(order);

        // Cập nhật trạng thái bàn tương ứng
        if (status == OrderStatus.CANCELLED) {
            tableRepository.findById(order.getTableId()).ifPresent(table -> {
                table.setStatus(TableStatus.EMPTY);
                tableRepository.save(table);
            });
        } else if (status == OrderStatus.PAID) {
            tableRepository.findById(order.getTableId()).ifPresent(table -> {
                table.setStatus(TableStatus.CLEANING);
                tableRepository.save(table);
            });
        }

        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLOSE: Đóng order sau khi thanh toán xong
    //  1. Cập nhật Order → status = PAID, closedAt = now()
    //  2. Trả bàn về trạng thái CLEANING (chờ dọn dẹp)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse closeOrder(UUID orderId) {
        // Bước 1: Lấy và đóng order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        order.setStatus(OrderStatus.PAID);
        order.setClosedAt(OffsetDateTime.now());
        orderRepository.save(order);

        // Bước 2: Tìm bàn tương ứng và chuyển sang CLEANING để nhân viên dọn dẹp
        tableRepository.findById(order.getTableId()).ifPresent(table -> {
            table.setStatus(TableStatus.CLEANING);
            tableRepository.save(table);
        });

        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Map Order entity → OrderResponse DTO
    //  - Lấy tableNumber từ TableRepository để hiển thị số bàn
    //  - Tính subtotal từ danh sách items (unitPrice × quantity, bỏ qua CANCELLED)
    // ─────────────────────────────────────────────────────────────────────────
    private OrderResponse mapToResponse(Order order) {
        String tableNumber = tableRepository.findById(order.getTableId())
                .map(Table::getNumber)
                .orElse(null);
        return mapToResponse(order, tableNumber);
    }

    private OrderResponse mapToResponse(Order order, String tableNumber) {

        // Tính subtotal: tổng (unitPrice × quantity) của các item chưa bị huỷ
        BigDecimal subtotal = order.getItems() == null ? BigDecimal.ZERO :
                order.getItems().stream()
                        .filter(item -> item.getStatus() != com.restaurant.common.enums.OrderItemStatus.CANCELLED)
                        .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Map từng item sang OrderItemResponse
        List<OrderItemResponse> itemResponses = order.getItems() == null ? List.of() :
                order.getItems().stream()
                        .map(item -> OrderItemResponse.builder()
                                .id(item.getId())
                                .itemId(item.getItemId())
                                .itemName(item.getItemName())
                                .unitPrice(item.getUnitPrice())
                                .quantity(item.getQuantity())
                                .totalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                                .note(item.getNote())
                                .status(item.getStatus())
                                .orderedAt(item.getOrderedAt())
                                .readyAt(item.getReadyAt())
                                .servedAt(item.getServedAt())
                                .build())
                        .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .tableId(order.getTableId())
                .tableNumber(tableNumber)   // Bổ sung từ Giai đoạn 2
                .status(order.getStatus())
                .guestCount(order.getGuestCount())
                .items(itemResponses)
                .subtotal(subtotal)
                .openedAt(order.getOpenedAt())
                .closedAt(order.getClosedAt())
                .build();
    }
}
