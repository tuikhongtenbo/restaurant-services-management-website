package com.restaurant.dto.request.menu;

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

@Data
public class CreateMenuItemRequest {

    @NotNull(message = "Nhân viên tạo món ăn không được để trống")
    private UUID updatedBy;  // UUID của staff đang tạo món này

    @NotBlank(message = "Tên món không được trống")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Danh mục không được trống")
    private String category;

    private String description;

    @NotBlank(message = "URL ảnh không được trống")
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
