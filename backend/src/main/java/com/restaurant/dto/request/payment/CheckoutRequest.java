package com.restaurant.dto.request.payment;

import com.restaurant.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CheckoutRequest {
    @NotNull(message = "Order ID không được để trống")
    private UUID orderId;

    private String customerPhone;   // nullable - nếu khách không tích điểm
    private UUID voucherId;         // nullable
    private Integer pointsToUse;    // nullable, default 0
    private PaymentMethod paymentMethod;
    private BigDecimal cashReceived; // nếu là CASH
}
