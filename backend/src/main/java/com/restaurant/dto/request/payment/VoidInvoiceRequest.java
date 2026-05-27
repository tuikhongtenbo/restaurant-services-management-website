package com.restaurant.dto.request.payment;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VoidInvoiceRequest {
    @NotBlank(message = "Lý do hủy không được để trống")
    private String voidReason;
}