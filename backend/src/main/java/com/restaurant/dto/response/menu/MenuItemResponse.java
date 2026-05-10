package com.restaurant.dto.response.menu;

import com.restaurant.common.enums.MenuItemStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class MenuItemResponse {
    private UUID id;
    private String category;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal promoPrice;
    private LocalTime promoStart;
    private LocalTime promoEnd;
    private String tags;
    private MenuItemStatus status;
    private Integer sortOrder;
    // updatedBy không trả ra — không cần thiết với client
}

// THY - Response mon an
// TODO:
//   UUID id
//   String category
//   String name
//   String description
//   String imageUrl
//   BigDecimal price
//   BigDecimal promoPrice
//   Boolean isPromoActive (true neu trong khung promo)
//   String tags
//   MenuItemStatus status
//   Integer sortOrder
//   LocalDateTime createdAt