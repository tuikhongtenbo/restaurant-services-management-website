package com.restaurant.repository;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

// Custom queries:
//   - Optional<Order> findByTableIdAndStatus(UUID tableId, OrderStatus status)
//   - List<Order>     findByStatus(OrderStatus status)
//   - Page<Order>     findByStatus(OrderStatus status, Pageable pageable)
//   - Page<Order>     findByOpenedAtBetween(from, to, pageable)
//   - Page<Order>     findByStatusAndOpenedAtBetween(status, from, to, pageable)
//   - List<Order>     findByWaiterId(UUID waiterId)
public interface OrderRepository extends JpaRepository<Order, UUID> {

    // Tìm đơn đang mở của một bàn cụ thể (dùng cho getOpenOrderByTable)
    Optional<Order> findByTableIdAndStatus(UUID tableId, OrderStatus status);

    // Kiểm tra bàn có đang tồn tại order với trạng thái nhất định không (dùng cho TableService.openTable / closeTable)
    boolean existsByTableIdAndStatus(UUID tableId, OrderStatus status);

    // Lấy danh sách đơn theo trạng thái (không phân trang — dùng nội bộ)
    List<Order> findByStatus(OrderStatus status);

    // Lấy danh sách đơn theo trạng thái có phân trang (dùng cho getOrders)
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    // Lọc đơn theo khoảng thời gian mở (dùng khi chỉ filter theo ngày)
    Page<Order> findByOpenedAtBetween(OffsetDateTime from, OffsetDateTime to, Pageable pageable);

    // Lọc đơn theo cả trạng thái lẫn khoảng thời gian mở
    Page<Order> findByStatusAndOpenedAtBetween(OrderStatus status, OffsetDateTime from,
                                               OffsetDateTime to, Pageable pageable);

    // Lấy danh sách đơn do một nhân viên phụ trách (dùng cho báo cáo ca)
    List<Order> findByWaiterId(UUID waiterId);
}