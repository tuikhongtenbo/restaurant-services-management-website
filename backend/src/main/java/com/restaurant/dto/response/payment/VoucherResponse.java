package com.restaurant.dto.response.payment;

import com.restaurant.common.enums.CustomerTier;
import com.restaurant.common.enums.VoucherDiscountType;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VoucherResponse {
    private UUID id;
    private String code;
    private String description;
    private VoucherDiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderValue;
    private CustomerTier minTier;
    private Integer minPoints;
    private OffsetDateTime validFrom;
    private OffsetDateTime validUntil;
    private Integer usageLimit;
    private Integer usedCount;
    private Boolean isActive;
    private OffsetDateTime createdAt;
}
