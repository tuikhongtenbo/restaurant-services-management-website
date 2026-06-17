package com.restaurant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Bảng trung gian lưu voucher được cấp phát cho từng khách hàng.
 * - Mỗi bản ghi đại diện cho một voucher được gắn với một khách hàng cụ thể.
 * - isUsed = true khi khách hàng đã sử dụng voucher đó.
 */
@Entity
@jakarta.persistence.Table(name = "customer_vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @Column(name = "is_used")
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;

    @Column(name = "assigned_at", updatable = false)
    private OffsetDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        assignedAt = OffsetDateTime.now();
    }
}
