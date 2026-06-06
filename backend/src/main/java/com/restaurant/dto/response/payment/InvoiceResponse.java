package com.restaurant.dto.response.payment;

import com.restaurant.common.enums.InvoiceStatus;
import com.restaurant.common.enums.PaymentMethod;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InvoiceResponse {
    private UUID id;
    private UUID orderId;
    private UUID cashierId;
    private BigDecimal subtotal;
    private String voucherCode;
    private BigDecimal discountAmount;
    private Integer pointsUsed;
    private BigDecimal pointsDeducted;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private UUID customerId;
    private String customerPhone;
    private Integer pointsEarned;
    private InvoiceStatus status;
    private String voidReason;
    private UUID voidedBy;
    private OffsetDateTime createdAt;
    private BigDecimal changeAmount;  // tiền thối (cashReceived - totalAmount)
}
