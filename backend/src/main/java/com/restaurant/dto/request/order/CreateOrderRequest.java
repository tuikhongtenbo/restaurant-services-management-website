package com.restaurant.dto.request.order;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;
// Tao don hang
// @NotNull UUID tableId
// Integer guestCount

@Data
public class CreateOrderRequest {
    @NotNull(message = "Table ID is required") 
    private UUID tableId;
    private Integer guestCount;
}