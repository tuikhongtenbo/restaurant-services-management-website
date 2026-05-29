package com.restaurant.controller.menu;

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
public class MenuController {
}
