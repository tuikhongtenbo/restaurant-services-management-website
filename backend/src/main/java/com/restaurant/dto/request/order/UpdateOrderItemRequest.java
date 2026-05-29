package com.restaurant.dto.request.order;

import lombok.Data;
// Sua/xoa mon trong don
// Integer quantity (neu = 0 thi huy)
// String note
@Data
public class UpdateOrderItemRequest {
    private Integer quantity;
    private String note;
}