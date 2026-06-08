package com.restaurant.dto.response.customer;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerLookupResponse {
    private String maskedName; // Ví dụ: Ngu*** An
    private Integer currentPoints;
    private String tier;
}
