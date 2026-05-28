package com.restaurant.dto.request.payment;

import com.restaurant.common.enums.CustomerTier;
import com.restaurant.common.enums.VoucherDiscountType;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UpdateVoucherRequest {
    private String description;
    private VoucherDiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderValue;
    private CustomerTier minTier;
    private Integer minPoints;
    private OffsetDateTime validFrom;
    private OffsetDateTime validUntil;
    private Integer usageLimit;
    private Boolean isActive;
}