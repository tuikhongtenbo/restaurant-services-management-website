package com.restaurant.dto.request.payment;

import com.restaurant.common.enums.CustomerTier;
import com.restaurant.common.enums.VoucherDiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateVoucherRequest {
    @NotBlank(message = "Mã voucher không được để trống")
    private String code;

    private String description;

    @NotNull(message = "Loại giảm giá không được để trống")
    private VoucherDiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @Positive(message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    private BigDecimal minOrderValue;
    private CustomerTier minTier;
    private Integer minPoints;
    private OffsetDateTime validFrom;
    private OffsetDateTime validUntil;
    private Integer usageLimit;
}