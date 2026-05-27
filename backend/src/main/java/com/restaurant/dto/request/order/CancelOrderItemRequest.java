package com.restaurant.dto.request.order;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
// Huy mon
// @NotBlank String reason
@Data
public class CancelOrderItemRequest {
    @NotBlank(message = "Cancel reason is required")
    private String reason;
}