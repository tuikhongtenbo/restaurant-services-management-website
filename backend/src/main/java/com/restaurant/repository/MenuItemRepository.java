package com.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.restaurant.model.MenuItem;
import com.restaurant.common.enums.MenuItemStatus;
import java.util.UUID;
import java.time.LocalDateTime;
import java.util.List;

// THY
// TODO: JpaRepository<MenuItem, UUID>
// Custom queries:
//   - List<MenuItem> findByCategory(String category)
//   - List<MenuItem> findByStatus(MenuItemStatus status)
//   - List<MenuItem> findByCategoryAndStatus(String category, MenuItemStatus status)
//   - List<MenuItem> findByStatusOrderBySortOrderAsc(MenuItemStatus status)
//   - @Query: tim cac mon co promoPrice dang ap dung (promoStart <= now <= promoEnd)
//   - List<MenuItem> findByTagsContaining(String tag)
// MenuItemRepository
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {

    List<MenuItem> findByCategory(String category);
    List<MenuItem> findByCategoryAndStatus(String category, MenuItemStatus status);

    List<MenuItem> findByPromoPriceIsNotNullAndPromoStartLessThanEqualAndPromoEndGreaterThanEqual(
        LocalDateTime start,
        LocalDateTime end
    );

    List<MenuItem> findActivePromotionalItems();

    Page<MenuItem> findByStatusAndDeletedAtIsNullOrderBySortOrderAsc(MenuItemStatus status, Pageable pageable);
    List<MenuItem> findByStatusAndDeletedAtIsNullOrderBySortOrderAsc(MenuItemStatus status);
    List<MenuItem> findByStatusOrderBySortOrderAsc(MenuItemStatus status);
    List<MenuItem> findByStatus(MenuItemStatus status);
    Page<MenuItem> findByCategoryAndStatusAndDeletedAtIsNullOrderBySortOrderAsc(String category, MenuItemStatus status, Pageable pageable);
    List<MenuItem> findByCategoryAndStatusAndDeletedAtIsNull(String category, MenuItemStatus status);
    boolean existsByCategoryAndNameAndDeletedAtIsNull(String category, String name);
    
}
