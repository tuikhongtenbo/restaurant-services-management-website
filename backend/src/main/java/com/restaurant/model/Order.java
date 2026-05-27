package com.restaurant.model;

import com.restaurant.common.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// Entity: Order (Don hang)
// @Entity @Table(name = "orders")
// Fields:
//   - id       : UUID, PK
//   - tableId  : UUID, FK → tables.id
//   - status   : VARCHAR(15) [open|paid|cancelled]
//   - guestCount: INT (so luong khach)
//   - waiterId : UUID, FK → users.id
//   - openedAt : TIMESTAMPTZ
//   - closedAt : TIMESTAMPTZ
// Annotations: @Enumerated for status
@Entity
@jakarta.persistence.Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Lưu UUID tạm để tham chiếu đến Table, không dùng @ManyToOne để tránh phụ thuộc code chưa xong
    @Column(name = "table_id", nullable = false)
    private UUID tableId;

    @Enumerated(EnumType.STRING)
    @Column(length = 15, nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.OPEN;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "waiter_id")
    private UUID waiterId;

    @Column(name = "opened_at", updatable = false)
    private OffsetDateTime openedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() { openedAt = OffsetDateTime.now(); }
}