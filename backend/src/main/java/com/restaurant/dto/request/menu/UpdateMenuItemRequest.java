package com.restaurant.dto.request.menu;

import com.restaurant.common.enums.MenuItemStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class UpdateMenuItemRequest {

    @Size(max = 100)
    private String name;

    private String category;
    private String description;
    private String imageUrl;

    @DecimalMin(value = "0", message = "Gia khong duoc am")
    private BigDecimal price;

    private MenuItemStatus status;
    private BigDecimal promoPrice;
    private LocalTime promoStart;
    private LocalTime promoEnd;
    private String tags;
    private Integer sortOrder;
}
