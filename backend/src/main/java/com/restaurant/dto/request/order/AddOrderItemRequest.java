package com.restaurant.dto.request.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

// Them mon vao don
// @NotNull UUID itemId
// @NotNull @Min(1) Integer quantity
// String note (VD: khong hanh, it cay)
// List<OrderItemOption> options (neu co)
@Data
public class AddOrderItemRequest {
    @NotNull(message = "Item ID is required")
    private UUID itemId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    private String note;
    private List<OrderItemOption> options;
}