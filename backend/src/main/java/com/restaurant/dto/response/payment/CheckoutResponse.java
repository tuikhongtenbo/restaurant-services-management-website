package com.restaurant.dto.response.payment;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CheckoutResponse {
    private UUID orderId;
    private BigDecimal subtotal;
    private String voucherCode;
    private BigDecimal voucherDiscount;
    private Integer pointsUsed;
    private BigDecimal pointsDeducted;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal totalAmount;
    private CustomerSummary customer;
    private Integer pointsEarned;
}
