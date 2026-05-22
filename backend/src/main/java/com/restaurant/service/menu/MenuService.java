package com.restaurant.service.menu;
import java.util.List;
import com.restaurant.dto.response.menu.CategoryResponse;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.restaurant.common.enums.MenuItemStatus;
import com.restaurant.dto.request.menu.CreateMenuItemRequest;
import com.restaurant.dto.request.menu.UpdateMenuItemRequest;
import com.restaurant.dto.response.menu.MenuItemResponse;
import com.restaurant.dto.response.menu.PriceHistoryResponse;
// THY
// TODO: @Service
// Methods:
//   Page<MenuItemResponse> getItems(String category, MenuItemStatus status, String tag, Pageable pageable)
//   MenuItemResponse getById(UUID id)
//   MenuItemResponse create(CreateMenuItemRequest request, UUID updatedBy)
//   MenuItemResponse update(UUID id, UpdateMenuItemRequest request, UUID updatedBy)
//   MenuItemResponse updatePrice(UUID id, BigDecimal newPrice, UUID updatedBy)
//   MenuItemResponse updateStatus(UUID id, MenuItemStatus status)
//   MenuItemResponse updateSortOrder(UUID id, Integer sortOrder)
//   void delete(UUID id)
//   Page<MenuItemResponse> getPublicMenu(String category, Pageable pageable) // chi available, co promo neu dung gio
//   PriceHistoryResponse getPriceHistory(UUID id)
//   List<MenuItemResponse> getRecommended() → goi y mon ban chay
public interface MenuService {
    Page<MenuItemResponse> getItems(String category, MenuItemStatus status, String tag, Pageable pageable);
    MenuItemResponse getById(UUID id);
    MenuItemResponse create(CreateMenuItemRequest request, UUID updatedBy);
    MenuItemResponse update(UUID id, UpdateMenuItemRequest request, UUID updatedBy);
    MenuItemResponse updatePrice(UUID id, BigDecimal newPrice, UUID updatedBy);
    MenuItemResponse updateStatus(UUID id, MenuItemStatus status);
    MenuItemResponse updateSortOrder(UUID id, Integer sortOrder);
    void delete(UUID id);
    Page<MenuItemResponse> getPublicMenu(String category, Pageable pageable);
    PriceHistoryResponse getPriceHistory(UUID id);
    List<MenuItemResponse> getRecommended();
}
