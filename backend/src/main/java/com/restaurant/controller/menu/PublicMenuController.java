package com.restaurant.controller.menu;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.response.menu.CategoryResponse;
import com.restaurant.dto.response.menu.MenuItemResponse;
import com.restaurant.service.menu.CategoryService;
import com.restaurant.service.menu.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/menu")
@RequiredArgsConstructor
public class PublicMenuController {

    private final CategoryService categoryService;
    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getPublicMenu() {
        List<CategoryResponse> categories = categoryService.getMenuGroupedByCategory();
        return ResponseEntity.ok(ApiResponse.success("Public menu retrieved successfully", categories));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getMenuItemById(@PathVariable UUID id) {
        MenuItemResponse item = menuService.getPublicById(id);
        return ResponseEntity.ok(ApiResponse.success("Menu item retrieved successfully", item));
    }

    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getRecommended() {
        List<MenuItemResponse> recommendedItems = menuService.getRecommended();
        return ResponseEntity.ok(ApiResponse.success("Recommended menu items retrieved successfully", recommendedItems));
    }
}

