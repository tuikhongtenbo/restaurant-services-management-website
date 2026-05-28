package com.restaurant.dto.response.payment;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentResponse {
    private UUID invoiceId;
    private String paymentUrl;
    private BigDecimal amount;
    private String orderInfo;
    private String transactionId;
}
