package com.restaurant.dto.request.menu;

import javax.annotation.processing.Generated;

// THY - Sua mon an
// TODO:
// String category
// String name
// String description
// String imageUrl
// BigDecimal promoPrice
// LocalTime promoStart, promoEnd
// String tags
// MenuItemStatus status
// Integer sortOrder
@Data
public class UpdateMenuItemRequest {

    @NotNull(message = "Nhân viên cập nhật món ăn không được để trống")
    private UUID updatedBy;  // UUID của staff đang cập nhật món này

    @Size(max = 100)
    private String name;

    private String category;

    private String description;
    private String imageUrl;

    @DecimalMin(value = "0", message = "Giá không được âm")
    // @DecimalMin = kiểm tra số thập phân tối thiểu
    private BigDecimal price;

    private MenuItemStatus status = MenuItemStatus.AVAILABLE;  // Mặc định là AVAILABLE nếu không gửi status

    private BigDecimal promoPrice;  // null = không khuyến mãi
    private LocalTime promoStart;
    private LocalTime promoEnd;

    private String tags;
    private Integer sortOrder;
}
