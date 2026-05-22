package com.restaurant.dto.request.menu;

import javax.annotation.processing.Generated;
// Thêm vào đầu file, sau dòng package
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.LocalTime;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;

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
