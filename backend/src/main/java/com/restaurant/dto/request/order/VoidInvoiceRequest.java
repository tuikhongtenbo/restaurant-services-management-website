package com.restaurant.dto.request.order;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Huy hoa don
// @NotBlank String reason
@Data
public class VoidInvoiceRequest {
    @NotBlank(message = "Void reason is required")
    private String reason;
}