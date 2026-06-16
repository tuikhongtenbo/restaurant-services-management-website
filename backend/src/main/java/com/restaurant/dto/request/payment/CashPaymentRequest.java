package com.restaurant.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CashPaymentRequest {
    @NotNull(message = "Số tiền nhận không được để trống")
    @Positive(message = "Số tiền nhận phải lớn hơn 0")
    private BigDecimal cashReceived;

    @NotNull(message = "Thông tin checkout không được để trống")
    private CheckoutRequest checkout;
}
