package com.restaurant.dto.response.auth;

import com.restaurant.common.enums.VoucherDiscountType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO trả về thông tin voucher đã được cấp phát cho khách hàng.
 * Bao gồm trạng thái đã dùng hay chưa và thời gian được cấp.
 */
@Data
@Builder
public class CustomerVoucherResponse {
    private UUID id;             // ID bản ghi customer_voucher
    private UUID voucherId;
    private String code;
    private String description;
    private VoucherDiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderValue;
    private OffsetDateTime validFrom;
    private OffsetDateTime validUntil;
    private Boolean isUsed;
    private OffsetDateTime usedAt;
    private OffsetDateTime assignedAt;
}
