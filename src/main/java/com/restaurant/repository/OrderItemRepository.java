package com.restaurant.repository;

// SINH
// TODO: JpaRepository<OrderItem, UUID>
// Custom queries:
//   - List<OrderItem> findByOrderId(UUID orderId)
//   - List<OrderItem> findByOrderIdAndStatus(UUID orderId, OrderItemStatus status)
//   - List<OrderItem> findByStatusIn(List<OrderItemStatus> statuses)
//   - @Query: lay cac item dang o trang thai pending/preparing (cho KDS)
//   - List<OrderItem> findByOrderedAtBetween(LocalDateTime from, LocalDateTime to)
