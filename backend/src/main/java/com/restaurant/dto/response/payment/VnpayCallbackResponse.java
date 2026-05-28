package com.restaurant.dto.response.payment;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VnpayCallbackResponse {
    private boolean success;
    private String responseCode;
    private String message;
    private UUID invoiceId;
    private UUID orderId;
}
