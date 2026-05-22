package com.restaurant.dto.response.menu;
import java.util.List;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
// THY - Response danh muc
// TODO:
//   String name
//   List<MenuItemResponse> items
@Data
@Builder

public class CategoryResponse {
    private String category;
    private List<MenuItemResponse> items;
}
