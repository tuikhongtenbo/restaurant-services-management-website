package com.restaurant.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VnpayCreateRequest {
    @NotNull(message = "Order ID không được để trống")
    private UUID orderId;

    private String customerPhone;
    private UUID voucherId;
    private Integer pointsToUse;
    private String bankCode;
}
