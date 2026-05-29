package com.restaurant.dto.response.menu;
import java.util.List;
import lombok.Data;
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
