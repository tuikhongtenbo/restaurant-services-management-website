package com.restaurant.controller.table;

// THY
// @RestController @RequestMapping("/api/tables")
//
// GET    /                   → Page<TableResponse> (filter: area, status)
// GET    /layout              → TableLayoutResponse
// GET    /available           → List<TableResponse> (filter: capacity, dateTime)
// GET    /{id}               → TableResponse
// POST   /                   → TableResponse (create)
// PUT    /{id}               → TableResponse (update)
// PUT    /{id}/position       → TableResponse (keo tha x,y)
// DELETE /{id}               → void (an ban - isActive=false)
// POST   /{id}/open          → TableResponse (mo ban)
// POST   /{id}/close        → TableResponse (dong ban)
public class TableController {
}
