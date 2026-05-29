package com.restaurant.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdjustPointsRequest {
    @NotNull(message = "Customer ID không được để trống")
    private UUID customerId;

    @NotNull(message = "Số điểm không được để trống")
    private Integer points;

    private String note;
}