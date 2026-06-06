package com.restaurant.dto.response.order;

import com.restaurant.common.enums.OrderItemStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

// Response chi tiet mon trong don
@Data
@Builder
public class OrderItemResponse {
    private UUID id;
    private UUID itemId;
    private String itemName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String note;
    private OrderItemStatus status;
    private OffsetDateTime orderedAt;
    private OffsetDateTime readyAt;
    private OffsetDateTime servedAt;
}