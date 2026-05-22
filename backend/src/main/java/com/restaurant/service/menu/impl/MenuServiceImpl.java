package com.restaurant.service.menu.impl;

import com.restaurant.common.enums.MenuItemStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.menu.CreateMenuItemRequest;
import com.restaurant.dto.request.menu.UpdateMenuItemRequest;
import com.restaurant.dto.response.menu.MenuItemResponse;
import com.restaurant.dto.response.menu.PriceHistoryResponse;
import com.restaurant.model.MenuItem;
import com.restaurant.repository.MenuItemRepository;
//import com.restaurant.repository.OrderItemRepository;
import com.restaurant.service.menu.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MenuServiceImpl implements MenuService {

    private final MenuItemRepository menuItemRepository;
    // private final OrderItemRepository orderItemRepository; // dùng cho getRecommended()

    // 1. GET ITEMS (ADMIN)
    // Có filter category + status + tag + phân trang
    @Override
    @Transactional(readOnly = true)
    public Page<MenuItemResponse> getItems(
            String category, MenuItemStatus status, String tag, Pageable pageable) {

        // Lấy tất cả rồi filter — đơn giản, phù hợp data nhỏ
        // Nếu data lớn → dùng Specification hoặc @Query
        var page = menuItemRepository.findAll(pageable);
        var content = page.getContent().stream()
                .filter(item -> category == null || category.equals(item.getCategory()))
                .filter(item -> status == null || item.getStatus() == status)
                .filter(item -> tag == null || (item.getTags() != null && item.getTags().contains(tag)))
                .map(this::toResponse)
                .toList();

        return new org.springframework.data.domain.PageImpl<>(content, pageable, content.size());
    }

    // 2. GET BY ID
    @Override
    @Transactional(readOnly = true)
    public MenuItemResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    // 9. GET PUBLIC MENU 
    // Chỉ AVAILABLE + có promo nếu đúng giờ + filter theo category
    @Override
    @Transactional(readOnly = true)
    public Page<MenuItemResponse> getPublicMenu(String category, Pageable pageable) {

        if (category != null) {
            return menuItemRepository
                    .findByCategoryAndStatusOrderBySortOrderAsc(
                        category, MenuItemStatus.AVAILABLE, pageable)
                    .map(this::toResponse);
        }

        return menuItemRepository
                .findByStatusOrderBySortOrderAsc(MenuItemStatus.AVAILABLE, pageable)
                .map(this::toResponse);
    }

    // 3. CREATE
    @Override
    public MenuItemResponse create(CreateMenuItemRequest request, UUID updatedBy) {

        // Kiểm tra tên món chưa tồn tại trong category
        if (menuItemRepository.existsByCategoryAndName(
                request.getCategory(), request.getName())) {
            throw new BusinessException(
                "Món '" + request.getName()
                + "' đã tồn tại trong danh mục " + request.getCategory()
            );
        }

        MenuItem item = MenuItem.builder()
                .name(request.getName())
                .category(request.getCategory())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .promoPrice(request.getPromoPrice())
                .promoStart(request.getPromoStart())
                .promoEnd(request.getPromoEnd())
                .tags(request.getTags())
                .sortOrder(request.getSortOrder())
                .status(MenuItemStatus.AVAILABLE) // mặc định available khi tạo
                .updatedBy(updatedBy)
                .build();

        return toResponse(menuItemRepository.save(item));
    }

    // 4. UPDATE
    @Override
    public MenuItemResponse update(UUID id, UpdateMenuItemRequest request, UUID updatedBy) {
        MenuItem item = findOrThrow(id);

        // Chỉ update field nào không null
        if (request.getName()        != null) item.setName(request.getName());
        if (request.getCategory()    != null) item.setCategory(request.getCategory());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getImageUrl()    != null) item.setImageUrl(request.getImageUrl());
        if (request.getPrice()       != null) item.setPrice(request.getPrice());
        if (request.getPromoPrice()  != null) item.setPromoPrice(request.getPromoPrice());
        if (request.getPromoStart()  != null) item.setPromoStart(request.getPromoStart());
        if (request.getPromoEnd()    != null) item.setPromoEnd(request.getPromoEnd());
        if (request.getTags()        != null) item.setTags(request.getTags());
        if (request.getSortOrder()   != null) item.setSortOrder(request.getSortOrder());

        item.setUpdatedBy(updatedBy);

        return toResponse(item); // @Transactional tự save
    }

    // 5. UPDATE PRICE 
    // Tách riêng vì đổi giá thường xuyên, cần log lại
    @Override
    public MenuItemResponse updatePrice(UUID id, BigDecimal newPrice, UUID updatedBy) {
        MenuItem item = findOrThrow(id);

        if (newPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Giá không được âm");
        }

        item.setPrice(newPrice);
        item.setUpdatedBy(updatedBy);

        return toResponse(item);
    }

    // 6. UPDATE STATUS
    @Override
    public MenuItemResponse updateStatus(UUID id, MenuItemStatus status) {
        MenuItem item = findOrThrow(id);
        item.setStatus(status);
        return toResponse(item);
    }

    // 7. UPDATE SORT ORDER
    @Override
    public MenuItemResponse updateSortOrder(UUID id, Integer sortOrder) {
        MenuItem item = findOrThrow(id);
        item.setSortOrder(sortOrder);
        return toResponse(item);
    }

    // 8. DELETE (soft delete)
    @Override
    public void delete(UUID id) {
        MenuItem item = findOrThrow(id);
        // Soft delete — ẩn món, không xóa khỏi DB
        // Giữ lại để order_items cũ vẫn tham chiếu được
        item.setStatus(MenuItemStatus.HIDDEN);
    }

    // 10. GET PRICE HISTORY 
    // Không có bảng history → trả thông tin giá hiện tại + promo
    @Override
    @Transactional(readOnly = true)
    public PriceHistoryResponse getPriceHistory(UUID id) {
        MenuItem item = findOrThrow(id);

        return PriceHistoryResponse.builder()
                .itemId(item.getId())
                .itemName(item.getName())
                .currentPrice(item.getPrice())
                .promoPrice(item.getPromoPrice())
                .promoStart(item.getPromoStart())
                .promoEnd(item.getPromoEnd())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    // 11. GET RECOMMENDED 
    // Gợi ý món bán chạy — đếm số lần xuất hiện trong order_items
    /*@Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getRecommended() {

        // Lấy top 5 itemId xuất hiện nhiều nhất trong order_items
        List<UUID> topItemIds = orderItemRepository
                .findTopSellingItemIds(5);
        //         ↑ custom query — xem phần Repository bên dưới

        // Lấy MenuItem theo id, giữ thứ tự top
        return topItemIds.stream()
                .map(itemId -> menuItemRepository.findById(itemId))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .filter(item -> item.getStatus() == MenuItemStatus.AVAILABLE)
                .map(this::toResponse)
                .toList();
    }
*/
    // 2 HELPERS 

    private MenuItem findOrThrow(UUID id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy món: " + id));
    }

    private MenuItemResponse toResponse(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .category(item.getCategory())
                .name(item.getName())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .price(item.getPrice())
                .promoPrice(item.getPromoPrice())
                .promoStart(item.getPromoStart())
                .promoEnd(item.getPromoEnd())
                .tags(item.getTags())
                .status(item.getStatus())
                .sortOrder(item.getSortOrder())
                .build();
    }

    @Override
    public List<MenuItemResponse> getRecommended() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRecommended'");
    }
}