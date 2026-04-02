package com.restaurant.controller.kds;

// SINH
// @RestController @RequestMapping("/api/customers")
// @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
//
// GET    /                          → Page<CustomerResponse> (filter: tier)
// GET    /search?phone=             → CustomerResponse
// GET    /{id}                      → CustomerResponse
// GET    /{id}/tier                → CustomerTierInfo
// PUT    /{id}                     → CustomerResponse
// PUT    /{id}/adjust-points       → CustomerResponse (Admin only)
// GET    /{id}/transactions        → List<PointHistoryResponse>
public class CustomerController {
}
