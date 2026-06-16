package com.restaurant.model;

import com.restaurant.common.enums.CustomerTier;
import com.restaurant.common.enums.VoucherDiscountType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@jakarta.persistence.Table(name = "vouchers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Voucher {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 30, unique = true, nullable = false)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", length = 10, nullable = false)
    private VoucherDiscountType discountType;

    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue;

    @Column(name = "min_order_value")
    private BigDecimal minOrderValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "min_tier", length = 10)
    @Builder.Default
    private CustomerTier minTier = CustomerTier.MEMBER;

    @Column(name = "min_points")
    private Integer minPoints;

    @Column(name = "valid_from")
    private OffsetDateTime validFrom;

    @Column(name = "valid_until")
    private OffsetDateTime validUntil;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    /**
     * Kiểm tra voucher đã bị xoá mềm chưa.
     * Khác với isActive (tắt tạm), deleted thì không còn xuất hiện trong bất kỳ danh sách nào.
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
