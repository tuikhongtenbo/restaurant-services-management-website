package com.restaurant.dto.response.menu;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder
public class PriceHistoryResponse {
    private UUID itemId;
    private String itemName;
    private BigDecimal currentPrice;
    private BigDecimal promoPrice;
    private LocalTime promoStart;
    private LocalTime promoEnd;
    private OffsetDateTime updatedAt;
}