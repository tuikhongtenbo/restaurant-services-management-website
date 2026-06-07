package com.restaurant.dto.request.menu;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateMenuItemRequest {

    @NotBlank(message = "Ten mon khong duoc trong")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Danh muc khong duoc trong")
    private String category;

    private String description;

    @NotBlank(message = "URL anh khong duoc trong")
    private String imageUrl;

    @NotNull(message = "Gia khong duoc trong")
    @DecimalMin(value = "0", message = "Gia khong duoc am")
    private BigDecimal price;

    private BigDecimal promoPrice;
    private LocalDateTime promoStart;
    private LocalDateTime promoEnd;
    private String tags;
    private Integer sortOrder;
}
