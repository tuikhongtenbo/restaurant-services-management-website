package com.restaurant.dto.response.order;

import com.restaurant.common.enums.OrderStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Response don hang
@Data
@Builder
public class OrderResponse {
    private UUID id;
    private UUID tableId;
    private String tableNumber; // Sẽ được map ở Giai đoạn 2
    private OrderStatus status;
    private Integer guestCount;
    private String waiterName;
    private List<OrderItemResponse> items;
    private BigDecimal subtotal;
    private OffsetDateTime openedAt;
    private OffsetDateTime closedAt;
}