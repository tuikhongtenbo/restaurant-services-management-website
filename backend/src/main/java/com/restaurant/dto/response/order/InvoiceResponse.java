package com.restaurant.dto.response.order;

import com.restaurant.common.enums.InvoiceStatus;
import com.restaurant.common.enums.PaymentMethod;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

// Response hoa don
@Data
@Builder
public class InvoiceResponse {
    private UUID id;
    private UUID orderId;
    private String cashierName;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal vatAmount;
    private BigDecimal totalAmount;
    private String voucherCode;
    private PaymentMethod paymentMethod;
    private Integer pointsUsed;
    private Integer pointsEarned;
    private InvoiceStatus status;
    private String voidReason;
    private OffsetDateTime createdAt;
}