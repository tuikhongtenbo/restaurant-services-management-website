package com.restaurant.dto.response.payment;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomerSummary {
    private UUID id;
    private String fullName;
    private String phone;
    private String tier;
    private Integer currentPoints;
    private BigDecimal totalSpent;
}
