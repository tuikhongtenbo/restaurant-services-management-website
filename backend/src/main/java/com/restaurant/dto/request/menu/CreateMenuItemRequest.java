package com.restaurant.dto.request.menu;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
public class CreateMenuItemRequest {

    @NotBlank(message = "Tên món không được trống")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Danh mục không được trống")
    private String category;

    private String description;
    private String imageUrl;

    @NotNull(message = "Giá không được trống")
    @DecimalMin(value = "0", message = "Giá không được âm")
    // @DecimalMin = kiểm tra số thập phân tối thiểu
    private BigDecimal price;

    private BigDecimal promoPrice;  // null = không khuyến mãi
    private LocalTime promoStart;
    private LocalTime promoEnd;

    private String tags;
    private Integer sortOrder;
}
// THY - Tao mon an
// TODO:
// @NotBlank String category
// @NotBlank String name
// String description
// String imageUrl
// @NotNull BigDecimal price
// BigDecimal promoPrice
// LocalTime promoStart, promoEnd
// String tags (VD: "Ban_chay,Moi,Chay")
// MenuItemStatus status
// Integer sortOrder
