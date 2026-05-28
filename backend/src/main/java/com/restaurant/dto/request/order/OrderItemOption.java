package com.restaurant.dto.request.order;

import lombok.Data;

import java.util.UUID;

@Data
public class OrderItemOption {
    private UUID optionId;
    private String optionName;
}
