package com.restaurant.service.menu.impl;

import com.restaurant.common.enums.MenuItemStatus;
import com.restaurant.dto.response.menu.CategoryResponse;
import com.restaurant.dto.response.menu.MenuItemResponse;
import com.restaurant.model.MenuItem;
import com.restaurant.repository.MenuItemRepository;
import com.restaurant.service.menu.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final MenuItemRepository menuItemRepository;

    // 1. GET ALL CATEGORIES
    // Lấy danh sách tên category — dùng cho filter dropdown
    @Override
    public List<String> getAllCategories() {
        // Lấy distinct category từ DB — chỉ những category có món AVAILABLE
        return menuItemRepository
                .findByStatus(MenuItemStatus.AVAILABLE)
                .stream()
                .map(MenuItem::getCategory)
                .distinct()
                .sorted()                    // sắp xếp A-Z
                .toList();
    }

    // 2. GET MENU GROUPED BY CATEGORY
    // Public menu — nhóm theo category, chỉ AVAILABLE, có promo nếu đúng giờ
    @Override
    public List<CategoryResponse> getMenuGroupedByCategory() {

        // Lấy tất cả món AVAILABLE, sắp xếp theo sortOrder
        List<MenuItem> availableItems = menuItemRepository
                .findByStatusOrderBySortOrderAsc(MenuItemStatus.AVAILABLE);

        // Nhóm theo category bằng stream
        // groupingBy → Map<String, List<MenuItem>>
        Map<String, List<MenuItem>> grouped = availableItems.stream()
                .collect(Collectors.groupingBy(MenuItem::getCategory));

        // Chuyển Map → List<CategoryResponse>
        return grouped.entrySet().stream()
                .map(entry -> CategoryResponse.builder()
                        .category(entry.getKey())
                        .items(entry.getValue().stream()
                                .map(this::toResponse)
                                .toList())
                        .totalItems(entry.getValue().size())
                        .build())
                .sorted((a, b) -> a.getCategory().compareTo(b.getCategory()))
                .toList();
    }

    // HELPER 
    private MenuItemResponse toResponse(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .category(item.getCategory())
                .name(item.getName())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .price(item.getPrice())
                .effectivePrice(calcEffectivePrice(item))
                .promoPrice(item.getPromoPrice())
                .promoStart(item.getPromoStart())
                .promoEnd(item.getPromoEnd())
                .tags(item.getTags())
                .status(item.getStatus())
                .sortOrder(item.getSortOrder())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    // Tính giá hiệu lực — đang trong giờ KM không?
    private BigDecimal calcEffectivePrice(MenuItem item) {
        if (item.getPromoPrice() == null
                || item.getPromoStart() == null
                || item.getPromoEnd() == null) {
            return item.getPrice();   // không có KM → giá gốc
        }

        LocalTime now = LocalTime.now();
        boolean inPromo = now.isAfter(item.getPromoStart())
                       && now.isBefore(item.getPromoEnd());

        return inPromo ? item.getPromoPrice() : item.getPrice();
    }
}