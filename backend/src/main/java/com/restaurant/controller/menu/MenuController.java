package com.restaurant.controller.menu;

import com.restaurant.common.enums.MenuItemStatus;
import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.menu.CreateMenuItemRequest;
import com.restaurant.dto.request.menu.UpdateMenuItemRequest;
import com.restaurant.dto.response.menu.MenuItemResponse;
import com.restaurant.dto.response.menu.PriceHistoryResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.menu.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

// THY
// @RestController @RequestMapping("/api/menu")
// @PreAuthorize("hasAnyRole('ADMIN','MANAGER')") cho create/update/delete
//
// GET    /items                     → Page<MenuItemResponse> (filter: category, status, tag)
// GET    /items/{id}               → MenuItemResponse
// GET    /items/{id}/price-history → List<PriceHistoryItem>
// POST   /items                     → MenuItemResponse
// PUT    /items/{id}               → MenuItemResponse
// PUT    /items/{id}/price         → MenuItemResponse
// PUT    /items/{id}/status        → MenuItemResponse
// PUT    /items/{id}/sort-order    → MenuItemResponse
// DELETE /items/{id}               → void
//
// GET    /categories                → List<String>
// POST   /categories                → void
// PUT    /categories/{id}
// DELETE /categories/{id}
@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    // ============ ITEMS ENDPOINTS ============

    /**
     * GET /api/menu/items
     * Lấy danh sách món ăn (filter: category, status, tag) - ADMIN/MANAGER only
     */
    @GetMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Page<MenuItemResponse>>> getItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) MenuItemStatus status,
            @RequestParam(required = false) String tag,
            Pageable pageable) {
        Page<MenuItemResponse> items = menuService.getItems(category, status, tag, pageable);
        return ResponseEntity.ok(ApiResponse.success("Menu items retrieved successfully", items));
    }

    /**
     * GET /api/menu/items/{id}
     * Lấy chi tiết món ăn - ADMIN/MANAGER only
     */
    @GetMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getItemById(@PathVariable UUID id) {
        MenuItemResponse item = menuService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Menu item retrieved successfully", item));
    }

    /**
     * GET /api/menu/items/{id}/price-history
     * Lấy lịch sử giá của món ăn - ADMIN/MANAGER only
     */
    @GetMapping("/items/{id}/price-history")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PriceHistoryResponse>> getPriceHistory(@PathVariable UUID id) {
        PriceHistoryResponse priceHistory = menuService.getPriceHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Price history retrieved successfully", priceHistory));
    }

    /**
     * POST /api/menu/items
     * Tạo mới món ăn - ADMIN/MANAGER only
     */
    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createItem(
            @Valid @RequestBody CreateMenuItemRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        MenuItemResponse item = menuService.create(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Menu item created successfully", item));
    }

    /**
     * PUT /api/menu/items/{id}
     * Cập nhật thông tin món ăn - ADMIN/MANAGER only
     */
    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateItem(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMenuItemRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        MenuItemResponse item = menuService.update(id, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Menu item updated successfully", item));
    }

    /**
     * PUT /api/menu/items/{id}/price
     * Cập nhật giá của món ăn - ADMIN/MANAGER only
     */
    @PutMapping("/items/{id}/price")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updatePrice(
            @PathVariable UUID id,
            @RequestParam BigDecimal price,
            @AuthenticationPrincipal CustomUserDetails principal) {
        MenuItemResponse item = menuService.updatePrice(id, price, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Menu item price updated successfully", item));
    }

    /**
     * PUT /api/menu/items/{id}/status
     * Cập nhật trạng thái của món ăn - ADMIN/MANAGER only
     */
    @PutMapping("/items/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam MenuItemStatus status) {
        MenuItemResponse item = menuService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Menu item status updated successfully", item));
    }

    /**
     * PUT /api/menu/items/{id}/sort-order
     * Cập nhật thứ tự hiển thị của món ăn - ADMIN/MANAGER only
     */
    @PutMapping("/items/{id}/sort-order")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateSortOrder(
            @PathVariable UUID id,
            @RequestParam Integer sortOrder) {
        MenuItemResponse item = menuService.updateSortOrder(id, sortOrder);
        return ResponseEntity.ok(ApiResponse.success("Menu item sort order updated successfully", item));
    }

    /**
     * DELETE /api/menu/items/{id}
     * Xóa (soft delete) món ăn - ADMIN/MANAGER only
     */
    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID id) {
        menuService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Menu item deleted successfully", null));
    }

    // ============ PUBLIC ENDPOINTS ============

    /**
     * GET /api/menu/public
     * Lấy danh sách món ăn công khai (AVAILABLE + có promo nếu đúng giờ) - Public
     */
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<Page<MenuItemResponse>>> getPublicMenu(
            @RequestParam(required = false) String category,
            Pageable pageable) {
        Page<MenuItemResponse> items = menuService.getPublicMenu(category, pageable);
        return ResponseEntity.ok(ApiResponse.success("Public menu retrieved successfully", items));
    }

    /**
     * GET /api/menu/recommended
     * Lấy danh sách món ăn được gợi ý (bán chạy) - Public
     */
    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<Page<MenuItemResponse>>> getRecommended(Pageable pageable) {
        // Note: getRecommended() trong service cần được update để trả Page thay vì List
        // Hoặc có thể gọi getPublicMenu() để lấy các món ăn khả dụng
        Page<MenuItemResponse> items = menuService.getPublicMenu(null, pageable);
        return ResponseEntity.ok(ApiResponse.success("Recommended menu retrieved successfully", items));
    }
}
