package com.restaurant.service.menu;
import com.restaurant.dto.response.menu.CategoryResponse;
import java.util.List;

// THY
// TODO: @Service
// Methods:
//   List<String> getAllCategories()
//   List<CategoryResponse> getMenuGroupedByCategory() → public menu
public interface CategoryService {
    List<String> getAllCategories();
    List<CategoryResponse> getMenuGroupedByCategory();
}
