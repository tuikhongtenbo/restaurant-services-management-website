package com.restaurant.model;

import com.restaurant.common.enums.OrderItemStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

// Entity: OrderItem (Chi tiet don hang)
// TODO: Implement OrderItem entity
// @Entity @Table(name = "order_items")
// Fields:
//   - id         : UUID, PK
//   - orderId    : UUID, FK → orders.id
//   - itemId     : UUID, FK → menu_items.id
//   - itemName   : VARCHAR(100) (snapshot ten mon luc dat)
//   - unitPrice  : DECIMAL(12,0)
//   - quantity   : INT DEFAULT 1
//   - note       : TEXT (VD: khong hanh, di chap)
//   - status     : VARCHAR(15) [pending|preparing|ready|served|cancelled]
//   - orderedBy  : UUID, FK → users.id
//   - orderedAt  : TIMESTAMPTZ
//   - readyAt    : TIMESTAMPTZ
//   - servedAt   : TIMESTAMPTZ
//   - cancelReason: TEXT
//   - cancelledAt: TIMESTAMPTZ
//   - cancelledBy: UUID, FK → users.id
// Annotations: @Enumerated for status
@Entity
@jakarta.persistence.Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    // Chỉ lưu UUID của Menu Item
    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Builder.Default
    private Integer quantity = 1;
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(length = 15)
    @Builder.Default
    private OrderItemStatus status = OrderItemStatus.PENDING;

    @Column(name = "ordered_by")
    private UUID orderedBy;

    @Column(name = "ordered_at", updatable = false)
    private OffsetDateTime orderedAt;

    @Column(name = "ready_at")
    private OffsetDateTime readyAt;

    @Column(name = "served_at")
    private OffsetDateTime servedAt;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @PrePersist
    protected void onCreate() { orderedAt = OffsetDateTime.now(); }
}