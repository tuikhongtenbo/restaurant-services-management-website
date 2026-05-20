package com.restaurant.repository;

import java.util.List;
import java.util.Queue;

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

    @Query("SELECT m FROM MenuItem m WHERE m.promoPrice IS NOT NULL AND m.promoStart <= CURRENT_TIMESTAMP AND m.promoEnd >= CURRENT_TIMESTAMP")
    List<MenuItem> findActivePromotionalItems();

    Page<MenuItem> findByStatusOrderBySortOrderAsc(MenuItemStatus status, Pageable pageable);
    List<MenuItem> findByStatusOrderBySortOrderAsc(MenuItemStatus status);
    List<MenuItem> findByStatus(MenuItemStatus status);
    Page<MenuItem> findByCategoryAndStatusOrderBySortOrderAsc(String category, MenuItemStatus status, Pageable pageable);
    boolean existsByCategoryAndName(String category, String name);
    
    // OrderItemRepository — thêm query đếm món bán chạy
    @Query("""
        SELECT oi.item.id FROM OrderItem oi
        WHERE oi.status = 'SERVED'
        GROUP BY oi.item.id
        ORDER BY COUNT(oi.id) DESC
        LIMIT :limit
        """)
    List<UUID> findTopSellingItemIds(@Param("limit") int limit);
}