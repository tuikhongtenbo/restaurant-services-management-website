package com.restaurant.repository;

import com.restaurant.common.enums.OrderItemStatus;
import com.restaurant.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Custom queries:
//   - List<OrderItem> findByOrderId(UUID orderId)
//   - List<OrderItem> findByOrderIdAndStatus(UUID orderId, OrderItemStatus status)
//   - List<OrderItem> findByStatusIn(List<OrderItemStatus> statuses)
//   - @Query: lay cac item dang o trang thai pending/preparing (cho KDS)
//   - List<OrderItem> findByOrderedAtBetween(LocalDateTime from, LocalDateTime to)
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrder_Id(UUID orderId);
    List<OrderItem> findByOrder_IdAndStatus(UUID orderId, OrderItemStatus status);
    List<OrderItem> findByStatusIn(List<OrderItemStatus> statuses);

    // Dùng cho màn hình KDS (bếp)
    @Query("SELECT i FROM OrderItem i WHERE i.status IN ('PENDING', 'PREPARING')")
    List<OrderItem> findPendingAndPreparingItems();

    List<OrderItem> findByOrderedAtBetween(OffsetDateTime from, OffsetDateTime to);

    long countByOrder_IdAndStatusIn(UUID orderId, List<OrderItemStatus> statuses);
}